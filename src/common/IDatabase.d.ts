export interface IDatabase {
    insert(table: string, values: {
        [key: string]: any;
    }): number;
    replace(table: string, values: {
        [key: string]: any;
    }): number;
    update(table: string, values: {
        [key: string]: any;
    }, whereClause: string, whereArs: Array<any>): number;
    delete(table: string, whereClause: string, whereArs: Array<any>): number;
    select(sql: string, params?: Array<any>, reduceFn?: Function): Promise<Array<any>>;
    query(table: string, columns?: Array<string>, selection?: string, selectionArgs?: Array<any>, groupBy?: string, orderBy?: string, limit?: string): Promise<Array<any>>;
    execSQL(sql: string): void;
    beginTransact(): void;
    commit(): void;
    rollback(): void;
    close(): void;
}
