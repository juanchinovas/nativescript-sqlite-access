import * as fs from "tns-core-modules/file-system";
import { DbCreationOptions, ReturnType, IDatabase, parseToDbValue, parseToJsValue, ExtendedPromise } from './sqlite-access.common';

// Super private variables
let _db: interop.Reference<any>;
let _dataReturnedType: ReturnType;

/**
 * This class allow you to connect to sqlite database on iOS
 */

class SqliteAccess implements IDatabase {

    /**
     * Default constructor
     * @param db interop.Reference<any>
     * @param returnType ReturnType
     */
    constructor(db: interop.Reference<any>, returnType: ReturnType) {
        _db = db;
        _dataReturnedType = returnType;
    }

    /**
     * Insert a row into table with the values (key = columns and values = columns value)
     *
     * @param {string} tableName
     * @param {{ [key: string]: any; }} values
     *
     * @returns {number}  id inserted
     */
    insert(tableName: string, values: { [key: string]: any; }): number {
        this.execSQL(`INSERT INTO ${tableName} (${Object.keys(values).join(",")}) VALUES(${__mapToAddOrUpdateValues(values, true)})`);
        let value = sqlite3_last_insert_rowid(_db.value);
        return Number(value);
    }

    /**
     * Replace a row values in the table with the values (key = columns and values = columns value).
     * The table must has a primary column to match with
     *
     * @param {string} tableName
     * @param {{ [key: string]: any; }} values
     *
     * @returns {number} rows affected
     */
    replace(tableName: string, values: { [key: string]: any; }): number {
        this.execSQL(`REPLACE INTO ${tableName} (${Object.keys(values).join(",")}) VALUES(${__mapToAddOrUpdateValues(values, true)})`);
        let value = sqlite3_changes(_db.value);
        return Number(value);
    }

    /**
     * Update a row values in the table with the values (key = columns and values = columns value) to the matched row.
     *
     * @param {string} tableName
     * @param {{ [key: string]: any; }} values
     * @param {string} whereClause
     * @param {Array<any>} whereArs
     *
     * @returns {number} rows affected
     */
    update(tableName: string, values: { [key: string]: any; }, whereClause: string, whereArs: any[]): number {
        whereClause = whereClause && "WHERE " + whereClause.replace(/\?/g, <any>__replaceQuestionMarkForParams(whereArs)) || "";
        this.execSQL(`UPDATE ${tableName} SET ${__mapToAddOrUpdateValues(values, false)} ${whereClause}`);
        let value = sqlite3_changes(_db.value);
        return Number(value);
    }

    /**
     * Delete rows or a row from the table that matches the condition.
     *
     * @param {string} tableName
     * @param {string} whereClause - optional
     * @param {Array<any>} whereArs - optional
     *
     * @returns {number} rows affected
     */
    delete(tableName: string, whereClause?: string, whereArgs?: any[]): number {
        whereClause = whereClause && "WHERE " + whereClause.replace(/\?/g, <any>__replaceQuestionMarkForParams(whereArgs)) || "";
        this.execSQL(`DELETE FROM ${tableName} ${whereClause}`);
        let value = sqlite3_changes(_db.value);
        return Number(value);
    }

    /**
     * Query the table data that matches the condition.
     * @see ExtendedPromise for more information.
     *
     * @param {string} sql SQL Query. `SELECT [COLUMNS,] FROM TABLE WHERE column1=? and column2=?`. WHERE clause can be omitted
     * @param {Array<any>} conditionParams - optional if there is not WHERE clause in the sql param
     *
     * @returns {ExtendedPromise} ExtendedPromise object that returns a Promise<Array<any>>
     */
    select(sql: string, conditionParams?: any[]): ExtendedPromise {
        return new ExtendedPromise(function(subscribers, resolve, error) {
            try {
                sql = sql.replace(/\?/g, <any>__replaceQuestionMarkForParams(conditionParams));
                let cursor =  __execQueryAndReturnStatement(sql, _db);
                const result = __processCursor(cursor, _dataReturnedType, subscribers.shift());
                resolve(result);
            } catch (ex) {
                error(ex);
            }
        });
    }

    /**
     * Execute a query selector with the params passed in
     * @see ExtendedPromise for more information.
     *
     * @param {string} tableName
     * @param {Array<string>} columns - optional
     * @param {string} selection - optional
     * @param {Array<string>} selectionArgs - optional
     * @param {string} groupBy - optional
     * @param {string} orderBy - optional
     * @param {string} limit - optional
     *
     * @returns {ExtendedPromise} ExtendedPromise object that returns a Promise<Array<any>>
     */
    query(tableName: string, columns?: string[], selection?: string, selectionArgs?: any[], groupBy?: string, orderBy?: string, limit?: string): ExtendedPromise {
        selection = selection && "WHERE " + selection.replace(/\?/g, <any>__replaceQuestionMarkForParams(selectionArgs)) || "";
        groupBy = groupBy && "GROUP BY " + groupBy || "";
        orderBy = orderBy && "ORDER BY " + orderBy || "";
        limit = limit && "LIMIT " + limit || "";
        const _columns = columns && columns.join(',') || `${tableName}.*`;
        let query = `SELECT ${_columns} FROM ${tableName} ${selection} ${groupBy} ${orderBy} ${limit}`;
        return new ExtendedPromise(function(subscribers, resolve, error) {
            try {
                let cursor =  __execQueryAndReturnStatement(query, _db);
                const result = <Array<any>>__processCursor(cursor, _dataReturnedType, subscribers.shift());
                resolve(result);
            } catch (ex) {
                error(`ErrCode:${ex}`);
            }
        });
    }
    /**
     * Execute a SQL script and do not return anything
     * @param {string} sql
     */
    execSQL(sql: string) {
        let cursorRef: interop.Reference<any>;
        cursorRef = __execQueryAndReturnStatement(sql, _db);
        sqlite3_finalize(cursorRef.value);
    }

    /**
     * Open a transaction
     */
    beginTransact() {
        this.execSQL("BEGIN TRANSACTION");
    }

    /**
     * Commit the transaction
     */
    commit() {
        this.execSQL("COMMIT TRANSACTION");
    }

    /**
     * Rollback a transaction
     */
    rollback() {
        this.execSQL("ROLLBACK TRANSACTION");
    }

    /**
     * Close the database connection
     */
    close(): void {
        if (_db === null) {
            return;
        }

        sqlite3_close(_db.value);
        _db = null;
    }
}

/** private function
 * Execute a sql script and return the sqlite3 statement object
 * @param sql string
 * @param dbPointer interop.Reference<any>
 *
 * @returns sqlite3 statement object stepped
 *
 * @throws
 * if sqlite3_prepare_v2 returns !== 0
 * if sqlite3_step !== 101
 */
function __execQueryAndReturnStatement(sql: string, dbPointer: interop.Reference<any>): any {
    let cursorRef = new interop.Reference<any>();
    let resultCode = sqlite3_prepare_v2(dbPointer.value, sql, -1, cursorRef, null);
    let applyStatementCode  = sqlite3_step(cursorRef.value);
    if (resultCode !== 0 /*SQLITE_OK*/ || (applyStatementCode !== 101 /*SQLITE_DONE*/ && applyStatementCode !== 100 /*SQLITE_ROW*/)) {
        sqlite3_finalize(cursorRef.value);
        cursorRef.value = null;
        cursorRef = null;

        throw NSString.stringWithUTF8String(sqlite3_errmsg(dbPointer.value)).toString();
    }
    return cursorRef.value;
}

/** private function
 * Return a function to replace the question mark in the
 * query ith the values
 *
 * @param whereParams Array<any>
 * @returns ()=>string|number
 */
function __replaceQuestionMarkForParams(whereParams: Array<any>): Function {
    let counter = 0;
    return () => {
        return parseToDbValue(whereParams[counter++]);
    };
}

/** private function
 * Curring function to loop sqlite cursor
 * @param cursor interop.Reference<any>
 *
 * @returns (returnType: ReturnType) => Array<any>;
 */
function __processCursor(cursorRef: any, returnType: ReturnType, reduceOrMapSub?: any) {
    let result: Array<any> | {} = reduceOrMapSub && reduceOrMapSub.initialValue || [];
    let dbValue = null,
        hasData = sqlite3_data_count(cursorRef) > 0;

    if (hasData) {
        let counter = 0;
        do {
            dbValue = __getRowValues(cursorRef, returnType);
            if (reduceOrMapSub) {
                if (reduceOrMapSub.initialValue) {
                    result = reduceOrMapSub.callback(result, dbValue, counter++);
                    continue;
                }
                dbValue = reduceOrMapSub.callback(dbValue, counter++);
            }
            (<Array<any>>result).push( dbValue );
            // Condition on the while fixes issue #8
        } while (sqlite3_step(cursorRef) === 100 /*SQLITE_ROW*/);
    }

    sqlite3_finalize(cursorRef);
    return result;
}

/** private function
 * Process the sqlite cursor and return a
 * js object with column/value or an array row
 *
 * @param cursor interop.Reference<any>
 * @param returnType ReturnType
 * @returns JS array of object like {[column:string]: any} or array
 */
function __getRowValues(cursor: any, returnType: ReturnType): any {

    let rowValue: any = {};
    if (returnType === ReturnType.AS_ARRAY) {
        rowValue = [];
    }

    let primitiveType = null;
    let columnName = '';
    let value = null;
    let columnCount: number = sqlite3_column_count(cursor);
    for (let i = 0; i < columnCount; i++) {
        primitiveType = sqlite3_column_type(cursor, i);
        columnName = sqlite3_column_name(cursor, i);
        columnName = NSString.stringWithUTF8String(columnName).toString();
        switch (primitiveType) {
            case 1/*FIELD_TYPE_INTEGER*/:
                value = sqlite3_column_int64(cursor, i);
                break;
            case 2/*FIELD_TYPE_FLOAT*/:
                value = sqlite3_column_double(cursor, i);
                break;
            case 3/*FIELD_TYPE_STRING*/:
                value = sqlite3_column_text(cursor, i);
                value = NSString.stringWithUTF8String(value).toString();
                value = parseToJsValue(value);
                break;
            case 4/*FIELD_TYPE_BLOB*/:
                // uncomment the code below if you wanna use it and change continue for a break
                /* NSData.dataWithBytesLength(sqlite3_column_blob(cursor, i), sqlite3_column_bytes(cursor, i)/*length* /);
                value = sqlite3_column_blob(cursor, i);*/
                continue;
            case 5/*FIELD_TYPE_NULL*/:
                value = null;
                break;
        }
        // If result wanted as array of array
        if (Array.isArray(rowValue) && returnType === ReturnType.AS_ARRAY) {
            rowValue.push(value);
            continue;
        }

        rowValue[columnName] = value;
    }
    return rowValue;
}

/** private function
 * open or create a read-write database, permanently or in memory
 * @param dbName string database name
 * @param mode number openness mode
 *
 * @returns interop.Reference<any> sqlite3*
 *
 * @throws
 * if sqlite3_open_v2 returned code !== 0
 */
function __openCreateDataBase(dbName: string, mode: number) {
    const dbInstance = new interop.Reference<any>();
    let resultCode: number = 0;
    if (dbName === ":memory:") {
        resultCode = sqlite3_open_v2(dbName, dbInstance, mode | 296 /*SQLITE_OPEN_MEMORY*/, null);
    } else {
        dbName = `${fs.knownFolders.documents().path}/${dbName}`;
        mode =  mode | 4 /*SQLITE_OPEN_CREATE*/;

        resultCode = sqlite3_open_v2(dbName, dbInstance, mode, null);
    }

    if (resultCode !== 0 /*SQLITE_OK*/) {
        throw `Could not open database. sqlite error code ${resultCode}`;
    }

    return dbInstance;
}

/**
 * Map a key/value JS object to Array<string>
 * @param values { [key: string]: any; }
 * @param inserting boolean
 *
 * @returns string
 */
function __mapToAddOrUpdateValues(values: { [key: string]: any; }, inserting: boolean = true) {
    let contentValues = [];
    for (const key in values) {
        if (values.hasOwnProperty(key)) {
            let value = parseToDbValue(values[key]);
            value = value === null ? 'null' : value;
            contentValues.push(inserting ? value : `${key}=${value}`);
        }
    }
    return contentValues.join(",");
}

/**
 * Create an instance of sqlite3*, execute the dropping and creating tables scripts if exists
 * and if the version number is greater the database version
 * @param dbName String
 * @param options DbCreationOptions
 * @returns SqliteAccess
 *
 * @throws
 * if database version < the user version
 * if no database name
 * if dropping table scripts error
 * if creating table scripts error
 */
export function DbBuilder(dbName: string, options?: DbCreationOptions): SqliteAccess {
    if (!dbName) throw "Must specify a db name";
    options = options || ({
        version: 1
    });
    // Ensure version be 1 or greater and returnType AS_OBJECT
    options.version = options.version || 1;
    options.returnType = options.returnType || ReturnType.AS_OBJECT;

    const db = __openCreateDataBase(dbName, 2/*SQLITE_OPEN_READWRITE*/);
    const currVersion = __dbVersion(db);
    if (options.version > currVersion) {
        __dbVersion(db, options.version);
        const tableCreateScripts = options.createTableScriptsFn && options.createTableScriptsFn();
        const tableDroptScripts = options.dropTableScriptsFn && options.dropTableScriptsFn();

        try {
            // Dropping all tables
            if (tableDroptScripts && currVersion > 0) {
                for (let script in tableDroptScripts) {
                    const cursorRef = __execQueryAndReturnStatement(tableDroptScripts[script], db);
                    sqlite3_finalize(cursorRef);
                }
            }

            // Creating all tables
            if (tableCreateScripts) {
                for (let script in tableCreateScripts) {
                    const cursorRef = __execQueryAndReturnStatement(tableCreateScripts[script], db);
                    sqlite3_finalize(cursorRef);
                }
            }
        } catch (error) {
            __dbVersion(db, currVersion);
            sqlite3_close(db);
            throw error;
        }

    } else if (options.version < currVersion) {
        sqlite3_close(db);
        throw `It is not possible to set the version ${options.version} to database, because is lower then current version, Db current version is ${currVersion}`;
    }
    return new SqliteAccess(db, options.returnType);
}

/** private function
 * get or set the database user_version
 * @param db sqlite3*
 * @param version number
 *
 * @returns number|undefined
 */
function __dbVersion(db: any, version?: number) {
    let sql = "PRAGMA user_version";

    if (isNaN(version)) {
        version = __execQueryReturnOneArrayRow(db, sql).pop();
    } else {
        const cursorRef = __execQueryAndReturnStatement(`${sql}=${version}`, db);
        sqlite3_finalize(cursorRef);
    }
    return version;
}

/** private function
 * execute a sql query and return the first row
 * @param db sqlite3*
 * @param query string
 *
 * @return Array<any>
 */
function __execQueryReturnOneArrayRow(db: any, query: string): any {
    const cursorRef = __execQueryAndReturnStatement(query, db);
    const result = <Array<any>>__processCursor(cursorRef, ReturnType.AS_ARRAY);
    return result.shift();
}

/**
 * Export ReturnType and DbCreationOptions
 */
export * from "./sqlite-access.common";