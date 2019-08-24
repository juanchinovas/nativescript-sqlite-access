

export const enum ReturnType {
    AS_OBJECT,
    AS_ARRAY
}

export interface DbCreationOptions {
    version?: number;
    createTableScriptsFn?: () => Array<string>; 
    dropTableScriptsFn?: () => Array<string>;
    returnType?: ReturnType
}