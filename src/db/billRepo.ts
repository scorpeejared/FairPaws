import { calculateBill } from '@/domain/calculate';
import { billSchema, settingsSchema, type Settings } from '@/domain/validation';
import type { AdjustmentKind, Bill, Money, RoundingDirection, SplitMode } from '@/domain/types';
import type { Db } from './types';

export interface BillSummary {
  id: string;
  title: string;
  currency: string;
  mode: SplitMode;
  total: Money;
  participantCount: number;
  createdAt: number;
  updatedAt: number;
}

interface BillRow {
  id: string;
  title: string;
  currency: string;
  mode: SplitMode;
  equal_amount: number;
  service_kind: AdjustmentKind;
  service_value: number;
  tax_kind: AdjustmentKind;
  tax_value: number;
  discount_kind: AdjustmentKind;
  discount_value: number;
  tip_kind: AdjustmentKind;
  tip_value: number;
  rounding_step: number;
  rounding_direction: RoundingDirection;
  created_at: number;
  updated_at: number;
  total: number;
  participant_count: number;
}

export async function listBillSummaries(db: Db): Promise<BillSummary[]> {
  const rows = await db.getAllAsync<BillRow>(
    'SELECT * FROM bills ORDER BY updated_at DESC, created_at DESC',
    [],
  );
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    currency: r.currency,
    mode: r.mode,
    total: r.total,
    participantCount: r.participant_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function getBill(db: Db, id: string): Promise<Bill | null> {
  const row = await db.getFirstAsync<BillRow>('SELECT * FROM bills WHERE id = ?', [id]);
  if (!row) return null;

  const [participants, items, shares] = await Promise.all([
    db.getAllAsync<{ id: string; name: string; color_index: number }>(
      'SELECT id, name, color_index FROM participants WHERE bill_id = ? ORDER BY position',
      [id],
    ),
    db.getAllAsync<{ id: string; name: string; unit_price: number; quantity: number }>(
      'SELECT id, name, unit_price, quantity FROM items WHERE bill_id = ? ORDER BY position',
      [id],
    ),
    db.getAllAsync<{ item_id: string; participant_id: string; portions: number }>(
      `SELECT s.item_id, s.participant_id, s.portions
       FROM item_shares s JOIN items i ON i.id = s.item_id WHERE i.bill_id = ?`,
      [id],
    ),
  ]);

  const sharesByItem = new Map<string, Record<string, number>>();
  for (const s of shares) {
    const map = sharesByItem.get(s.item_id) ?? {};
    map[s.participant_id] = s.portions;
    sharesByItem.set(s.item_id, map);
  }

  const candidate = {
    id: row.id,
    title: row.title,
    currency: row.currency,
    mode: row.mode,
    participants: participants.map((p) => ({ id: p.id, name: p.name, colorIndex: p.color_index })),
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      unitPrice: i.unit_price,
      quantity: i.quantity,
      shares: sharesByItem.get(i.id) ?? {},
    })),
    equalAmount: row.equal_amount,
    service: { kind: row.service_kind, value: row.service_value },
    tax: { kind: row.tax_kind, value: row.tax_value },
    discount: { kind: row.discount_kind, value: row.discount_value },
    tip: { kind: row.tip_kind, value: row.tip_value },
    rounding: { step: row.rounding_step, direction: row.rounding_direction },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  const parsed = billSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new Error(`Bill ${id} is corrupted and cannot be opened.`);
  }
  return parsed.data;
}

/** Inserts or fully replaces a bill and its children in one transaction. */
export async function saveBill(db: Db, bill: Bill): Promise<void> {
  const total = calculateBill(bill).total;
  await db.withTransactionAsync(async () => {
    // Upsert the parent (keeps created_at), then rewrite the children.
    await db.runAsync(
      `INSERT INTO bills (
         id, title, currency, mode, equal_amount,
         service_kind, service_value, tax_kind, tax_value,
         discount_kind, discount_value, tip_kind, tip_value,
         rounding_step, rounding_direction, created_at, updated_at, total, participant_count
       ) VALUES (?,?,?,?,?, ?,?,?,?, ?,?,?,?, ?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         title=excluded.title, currency=excluded.currency, mode=excluded.mode,
         equal_amount=excluded.equal_amount,
         service_kind=excluded.service_kind, service_value=excluded.service_value,
         tax_kind=excluded.tax_kind, tax_value=excluded.tax_value,
         discount_kind=excluded.discount_kind, discount_value=excluded.discount_value,
         tip_kind=excluded.tip_kind, tip_value=excluded.tip_value,
         rounding_step=excluded.rounding_step, rounding_direction=excluded.rounding_direction,
         updated_at=excluded.updated_at, total=excluded.total,
         participant_count=excluded.participant_count`,
      [
        bill.id,
        bill.title,
        bill.currency,
        bill.mode,
        bill.equalAmount,
        bill.service.kind,
        bill.service.value,
        bill.tax.kind,
        bill.tax.value,
        bill.discount.kind,
        bill.discount.value,
        bill.tip.kind,
        bill.tip.value,
        bill.rounding.step,
        bill.rounding.direction,
        bill.createdAt,
        bill.updatedAt,
        total,
        bill.participants.length,
      ],
    );
    await db.runAsync('DELETE FROM participants WHERE bill_id = ?', [bill.id]);
    await db.runAsync('DELETE FROM items WHERE bill_id = ?', [bill.id]); // cascades to item_shares

    for (const [position, p] of bill.participants.entries()) {
      await db.runAsync(
        'INSERT INTO participants (id, bill_id, name, color_index, position) VALUES (?,?,?,?,?)',
        [p.id, bill.id, p.name, p.colorIndex, position],
      );
    }
    for (const [position, item] of bill.items.entries()) {
      await db.runAsync(
        'INSERT INTO items (id, bill_id, name, unit_price, quantity, position) VALUES (?,?,?,?,?,?)',
        [item.id, bill.id, item.name, item.unitPrice, item.quantity, position],
      );
      for (const [participantId, portions] of Object.entries(item.shares)) {
        if (portions <= 0) continue;
        await db.runAsync('INSERT INTO item_shares (item_id, participant_id, portions) VALUES (?,?,?)', [
          item.id,
          participantId,
          portions,
        ]);
      }
    }
  });
}

export async function deleteBill(db: Db, id: string): Promise<void> {
  await db.runAsync('DELETE FROM bills WHERE id = ?', [id]);
}

export async function deleteAllBills(db: Db): Promise<void> {
  await db.runAsync('DELETE FROM bills', []);
}

export async function loadSettings(db: Db): Promise<Settings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings', []);
  const raw: Record<string, unknown> = {};
  for (const { key, value } of rows) {
    try {
      raw[key] = JSON.parse(value);
    } catch {
      // Ignore unreadable values; schema defaults apply.
    }
  }
  return settingsSchema.parse(raw);
}

export async function saveSetting<K extends keyof Settings>(
  db: Db,
  key: K,
  value: Settings[K],
): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, JSON.stringify(value)],
  );
}
