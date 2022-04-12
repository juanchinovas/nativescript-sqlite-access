import { DbCreationOptions, ReturnType, IDatabase, QueryProcessor } from './sqlite-access.common';
declare class SqliteAccess implements IDatabase {
    private db;
    private returnType;
    constructor(db: android.database.sqlite.SQLiteDatabase, returnType: ReturnType);
    insert(table: string, values: {
        [key: string]: any;
    }): number;
    replace(table: string, values: {
        [key: string]: any;
    }): number;
    update(table: string, values: {
        [key: string]: any;
    }, whereClause: string, whereArs: any[]): number;
    delete(table: string, whereClause?: string, whereArgs?: any[]): number;
    select(sql: string, params?: any[]): QueryProcessor;
    selectAsCursor(sql: string, params?: any[]): Generator<any, void, unknown>;
    query(param: {
        tableName: string;
        columns?: string[];
        selection?: string;
        selectionArgs?: any[];
        groupBy?: string;
        orderBy?: string;
        limit?: string;
    }): QueryProcessor;
    execSQL(sql: string): void;
    beginTransact(): void;
    commit(): void;
    rollback(): void;
    close(): void;
    isClose(): boolean;
}
export declare function DbBuilder(dbName: string, options?: DbCreationOptions): SqliteAccess;
export * from "./sqlite-access.common";
