import { DbCreationOptions, ReturnType, IDatabase, QueryProcessor } from "./sqlite-access.common";
declare class SqliteAccess implements IDatabase {
    private db;
    private returnType;
    constructor(db: android.database.sqlite.SQLiteDatabase, returnType: ReturnType);
    insert(table: string, values: {
        [key: string]: unknown;
    }): number;
    replace(table: string, values: {
        [key: string]: unknown;
    }): number;
    update(table: string, values: {
        [key: string]: unknown;
    }, whereClause: string, whereArs: unknown[]): number;
    delete(table: string, whereClause?: string, whereArgs?: unknown[]): number;
    select<T>(sql: string, params?: unknown[]): QueryProcessor<T>;
    query<T>(param: {
        tableName: string;
        columns?: string[];
        selection?: string;
        selectionArgs?: unknown[];
        groupBy?: string;
        orderBy?: string;
        limit?: string;
    }): QueryProcessor<T>;
    execSQL(sql: string): void;
    beginTransact(): void;
    commit(): void;
    rollback(): void;
    close(): void;
    isClose(): boolean;
}
export declare function DbBuilder(dbName: string, options?: DbCreationOptions): SqliteAccess;
export * from "./sqlite-access.common";
