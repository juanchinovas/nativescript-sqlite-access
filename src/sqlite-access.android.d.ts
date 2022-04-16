import { DbCreationOptions, ReturnType, IDatabase, QueryProcessor } from "./sqlite-access.common";
declare class SqliteAccess implements IDatabase {
    private db;
    private returnType;
    constructor(db: android.database.sqlite.SQLiteDatabase, returnType: ReturnType);
    insert(tableName: string, values: {
        [key: string]: unknown;
    }): number;
    replace(tableName: string, values: {
        [key: string]: unknown;
    }): number;
    update(tableName: string, values: {
        [key: string]: unknown;
    }, whereClause: string, whereArgs: unknown[]): number;
    delete(tableName: string, whereClause?: string, whereArgs?: unknown[]): number;
    select<T>(sql: string, params?: unknown[]): QueryProcessor<T>;
    query<T>(param: {
        tableName: string;
        columns?: string[];
        selection?: string;
        selectionArgs?: unknown[];
        groupBy?: string;
        having?: string;
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
