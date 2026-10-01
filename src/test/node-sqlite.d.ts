// Kiểu tối thiểu của node:sqlite cho store.test.ts (không bật kiểu Node cho cả app: app chạy trên Hermes)
declare module 'node:sqlite' {
  type Value = null | number | bigint | string | Uint8Array
  class StatementSync {
    run(...params: Value[]): unknown
    get(...params: Value[]): unknown
    all(...params: Value[]): unknown[]
  }
  export class DatabaseSync {
    constructor(path: string)
    exec(sql: string): void
    prepare(sql: string): StatementSync
  }
}
