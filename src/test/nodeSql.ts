// Kho chương trên SQLite thật của Node (node:sqlite) thay expo-sqlite, cho test của features/offline
import { DatabaseSync } from 'node:sqlite'
import type { OfflineSql, SqlParam } from '@/features/offline/sqlite'

/** Bọc node:sqlite theo đúng các hàm expo-sqlite mà kho dùng; mỗi lần gọi là một kho trống mới */
export function nodeSql(): OfflineSql {
  const db = new DatabaseSync(':memory:')
  return {
    execAsync: async (source) => void db.exec(source),
    runAsync: async (source, params) => db.prepare(source).run(...(params as never[])),
    getFirstAsync: async <T>(source: string, params: SqlParam[]) =>
      (db.prepare(source).get(...(params as never[])) as T | undefined) ?? null,
    getAllAsync: async <T>(source: string, params: SqlParam[]) =>
      db.prepare(source).all(...(params as never[])) as T[],
    withTransactionAsync: async (task) => {
      db.exec('BEGIN')
      try {
        await task()
        db.exec('COMMIT')
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    },
  }
}
