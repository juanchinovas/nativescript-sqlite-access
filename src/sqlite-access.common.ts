export interface IDatabase {
    insert(table: string, values: { [key: string]: any }): number;
    replace(table: string, values: { [key: string]: any }): number;
    update(table: string, values: { [key: string]: any }, whereClause: string, whereArs: Array<any>): number;
    delete(table: string, whereClause: string, whereArs: Array<any>): number;
    select(sql: string, params?: Array<any>, reduceFn?: Function): Promise<Array<any>>;
    query(table: string, columns?: Array<string>,
        selection?: string, selectionArgs?: Array<any>,
        groupBy?: string, orderBy?: string, limit?: string): Promise<Array<any>>;
    execSQL(sql: string): void;

    beginTransact(): void;
    commit(): void;
    rollback(): void;

    close(): void;
}

/**
 * This enum indicate the format data return from database
 */
export const enum ReturnType {
    AS_OBJECT,
    AS_ARRAY
}

/**
 * This is a configuration interface to indicate the tables,
 * version and the return type of data from database
 */
export interface DbCreationOptions {
    version?: number;
    createTableScriptsFn?: () => Array<string>;
    dropTableScriptsFn?: () => Array<string>;
    returnType?: ReturnType;
}

/**
 * Parse value to database
 * @param {any} value
 */
export function parseToDbValue(value: any) {
    if (value === 0) return value;
    if (value === '') return "''";
    if (value && value instanceof Function) return null;

    if (value && typeof value === 'object' && value.constructor === Object ||
        value && typeof value === 'object' && value.constructor === Array ||
        value && typeof value === 'object' && value.constructor.constructor === Function) {
        value = JSON.stringify(value);
    }
    // Fixes issue #7
    return Number(value) || (value && `'${value.toString().replace(/'/g, "''")}'` || null);
}

/**
 * Parse value to JS
 * @param {any} value
 */
export function parseToJsValue(value: any) {
    if (!value) return value;

    let parsedValue = value;
    try {
        parsedValue = JSON.parse(value);
    } catch (ex) {}
    return parsedValue;
}