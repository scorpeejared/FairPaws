import * as SQLite from 'expo-sqlite';
import { migrate } from './migrations';
import type { Db } from './types';

// Keeps the pre-rename filename on purpose: changing it would orphan bills already saved on devices.
const DB_NAME = 'splitfair.db';

let opening: Promise<Db> | null = null;

/** Opens the on-device database once, applying any pending migrations. */
export function getDb(): Promise<Db> {
  if (!opening) {
    opening = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await migrate(db);
      return db;
    })();
    // Allow a retry after a failed open.
    opening.catch(() => {
      opening = null;
    });
  }
  return opening;
}
