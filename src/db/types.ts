export type BindValue = string | number | null;

/**
 * The slice of expo-sqlite's SQLiteDatabase that the repositories use.
 * Keeping it narrow lets the same SQL run against better-sqlite3 in tests.
 */
export interface Db {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: BindValue[]): Promise<unknown>;
  getAllAsync<T>(sql: string, params: BindValue[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params: BindValue[]): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
