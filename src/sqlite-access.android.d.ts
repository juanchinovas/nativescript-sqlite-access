import { IDatabase } from './common/IDatabase';
import { DbCreationOptions } from './common/Common';
declare class SqliteAccess implements IDatabase {
    private _db;
    private _options;
    constructor(db: android.database.sqlite.SQLiteDatabase, options: DbCreationOptions);
    insert(table: string, values: {
        [key: string]: any;
    }): number;
    replace(table: string, values: {
        [key: string]: any;
    }): number;
    update(table: string, values: {
        [key: string]: any;
    }, whereClause: string, whereArs: any[]): number;
    delete(table: string, whereClause: string, whereArs: any[]): number;
    select(sql: string, params?: any[]): Promise<Array<any>>;
    query(table: string, columns?: string[], selection?: string, selectionArgs?: any[], groupBy?: string, orderBy?: string, limit?: string): Promise<Array<any>>;
    execSQL(sql: string): void;
    beginTransact(): void;
    commit(): void;
    rollback(): void;
    close(): void;
}
export declare function DbBuilder(dbName: string, options?: DbCreationOptions): SqliteAccess;
export {};
