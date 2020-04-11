import { DbCreationOptions, ReturnType, IDatabase, ExtendedPromise } from './sqlite-access.common';
declare class SqliteAccess implements IDatabase {
    constructor(db: interop.Reference<any>, returnType: ReturnType);
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
    select(sql: string, params?: any[]): ExtendedPromise;
    query(table: string, columns?: string[], selection?: string, selectionArgs?: any[], groupBy?: string, orderBy?: string, limit?: string): ExtendedPromise;
    execSQL(sql: string): void;
    beginTransact(): void;
    commit(): void;
    rollback(): void;
    close(): void;
}
export declare function DbBuilder(dbName: string, options?: DbCreationOptions): SqliteAccess;
export * from "./sqlite-access.common";
