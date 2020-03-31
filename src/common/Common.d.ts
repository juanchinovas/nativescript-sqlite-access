export declare const enum ReturnType {
    AS_OBJECT = 0,
    AS_ARRAY = 1
}
export interface DbCreationOptions {
    version?: number;
    createTableScriptsFn?: () => Array<string>;
    dropTableScriptsFn?: () => Array<string>;
    returnType?: ReturnType;
}