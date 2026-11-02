import { DEFAULT_CURRENCY, getCurrency } from './currency';
import { MAX_MONEY } from './money';
import type { Adjustment, Bill, Item, Participant, Rounding } from './types';

const PALETTE_SIZE = 8;

let counter = 0;
function newId(): string {
  counter = (counter + 1) % 1_000_000;
  return Date.now().toString(36) + counter.toString(36) + Math.random().toString(36).slice(2, 8);
}

const NO_ADJUSTMENT: Adjustment = { kind: 'percent', value: 0 };
const NO_ROUNDING: Rounding = { step: 0, direction: 'nearest' };

export function createBill(currency: string = DEFAULT_CURRENCY, now = Date.now()): Bill {
  return {
    id: newId(),
    title: '',
    currency,
    mode: 'items',
    participants: [],
    items: [],
    equalAmount: 0,
    service: { ...NO_ADJUSTMENT },
    tax: { ...NO_ADJUSTMENT },
    discount: { ...NO_ADJUSTMENT },
    tip: { ...NO_ADJUSTMENT },
    rounding: { ...NO_ROUNDING },
    createdAt: now,
    updatedAt: now,
  };
}

export function createParticipant(name: string, existing: Participant[]): Participant {
  const used = new Set(existing.map((p) => p.colorIndex));
  let colorIndex = 0;
  while (used.has(colorIndex) && colorIndex < PALETTE_SIZE) colorIndex++;
  if (colorIndex >= PALETTE_SIZE) colorIndex = existing.length % PALETTE_SIZE;
  return { id: newId(), name: name.trim(), colorIndex };
}

export function createItem(partial: Partial<Omit<Item, 'id'>> = {}): Item {
  return {
    id: newId(),
    name: '',
    unitPrice: 0,
    quantity: 1,
    shares: {},
    ...partial,
  };
}

/** Deep copy with fresh ids so the duplicate shares nothing with the original. */
export function duplicateBill(bill: Bill, now = Date.now()): Bill {
  const idMap = new Map<string, string>();
  const participants = bill.participants.map((p) => {
    const id = newId();
    idMap.set(p.id, id);
    return { ...p, id };
  });
  const items = bill.items.map((item) => ({
    ...item,
    id: newId(),
    shares: Object.fromEntries(
      Object.entries(item.shares).flatMap(([pid, portions]) => {
        const next = idMap.get(pid);
        return next ? [[next, portions]] : [];
      }),
    ),
  }));
  return {
    ...bill,
    id: newId(),
    title: bill.title.trim() ? `${bill.title.trim()} (copy)` : '',
    participants,
    items,
    service: { ...bill.service },
    tax: { ...bill.tax },
    discount: { ...bill.discount },
    tip: { ...bill.tip },
    rounding: { ...bill.rounding },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Switches currency, keeping every amount's face value. Moving between
 * currencies with different decimal places (₱10.00 -> ¥10) rescales the
 * stored minor units so nothing silently becomes 100x bigger or smaller.
 */
export function changeCurrency(bill: Bill, code: string): Bill {
  const from = getCurrency(bill.currency).decimals;
  const to = getCurrency(code).decimals;
  if (from === to) return { ...bill, currency: code };
  const scale = (v: number) =>
    Math.min(MAX_MONEY, to > from ? v * 10 ** (to - from) : Math.round(v / 10 ** (from - to)));
  const adjust = (a: Adjustment): Adjustment => (a.kind === 'fixed' ? { ...a, value: scale(a.value) } : a);
  return {
    ...bill,
    currency: code,
    equalAmount: scale(bill.equalAmount),
    items: bill.items.map((i) => ({ ...i, unitPrice: scale(i.unitPrice) })),
    service: adjust(bill.service),
    tax: adjust(bill.tax),
    discount: adjust(bill.discount),
    tip: adjust(bill.tip),
  };
}

/** True when nothing has been entered; such bills aren't worth saving. */
export function isBlankBill(bill: Bill): boolean {
  return (
    bill.title.trim() === '' &&
    bill.participants.length === 0 &&
    bill.items.length === 0 &&
    bill.equalAmount === 0
  );
}

export function removeParticipant(bill: Bill, participantId: string): Bill {
  return {
    ...bill,
    participants: bill.participants.filter((p) => p.id !== participantId),
    items: bill.items.map((item) => {
      if (!(participantId in item.shares)) return item;
      const { [participantId]: _removed, ...shares } = item.shares;
      return { ...item, shares };
    }),
  };
}
