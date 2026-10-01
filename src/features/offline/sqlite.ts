// Mở file SQLite của kho chương (expo-sqlite). Tách riêng để test thay bằng node:sqlite
// (store.test.ts): vitest không chạy được module native của React Native.
import { openDatabaseAsync, type SQLiteBindValue } from 'expo-sqlite'

export type SqlParam = SQLiteBindValue

/** Phần API SQLite kho chương cần (tập con của SQLiteDatabase của expo-sqlite) */
export type OfflineSql = {
  execAsync(source: string): Promise<void>
  runAsync(source: string, params: SqlParam[]): Promise<unknown>
  getFirstAsync<T>(source: string, params: SqlParam[]): Promise<T | null>
  getAllAsync<T>(source: string, params: SqlParam[]): Promise<T[]>
  withTransactionAsync(task: () => Promise<void>): Promise<void>
}

export const openOfflineDatabase = (): Promise<OfflineSql> =>
  openDatabaseAsync('offline-reading.db')
