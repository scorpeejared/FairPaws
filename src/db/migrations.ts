import type { Db } from './types';

/**
 * Each entry upgrades the schema by one version. Never edit a shipped entry;
 * append a new one instead.
 */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE bills (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    currency TEXT NOT NULL,
    mode TEXT NOT NULL,
    equal_amount INTEGER NOT NULL,
    service_kind TEXT NOT NULL, service_value INTEGER NOT NULL,
    tax_kind TEXT NOT NULL, tax_value INTEGER NOT NULL,
    discount_kind TEXT NOT NULL, discount_value INTEGER NOT NULL,
    tip_kind TEXT NOT NULL, tip_value INTEGER NOT NULL,
    rounding_step INTEGER NOT NULL,
    rounding_direction TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    total INTEGER NOT NULL DEFAULT 0,
    participant_count INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_bills_updated ON bills(updated_at DESC);

  CREATE TABLE participants (
    id TEXT PRIMARY KEY NOT NULL,
    bill_id TEXT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color_index INTEGER NOT NULL,
    position INTEGER NOT NULL
  );
  CREATE INDEX idx_participants_bill ON participants(bill_id);

  CREATE TABLE items (
    id TEXT PRIMARY KEY NOT NULL,
    bill_id TEXT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    unit_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    position INTEGER NOT NULL
  );
  CREATE INDEX idx_items_bill ON items(bill_id);

  CREATE TABLE item_shares (
    item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    participant_id TEXT NOT NULL,
    portions INTEGER NOT NULL,
    PRIMARY KEY (item_id, participant_id)
  );

  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
];

export const LATEST_VERSION = MIGRATIONS.length;

export async function migrate(db: Db): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  const current = row?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[v]);
      await db.execAsync(`PRAGMA user_version = ${v + 1};`);
    });
  }
}
