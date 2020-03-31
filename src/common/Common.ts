
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