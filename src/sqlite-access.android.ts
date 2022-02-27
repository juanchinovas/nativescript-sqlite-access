import { Application } from "@nativescript/core";
import {
    DbCreationOptions,
    ReturnType,
    IDatabase,
    parseToDbValue,
    ExtendedPromise,
    runInitialDbScript,
    readDbValue
} from './sqlite-access.common';

/**
 * This class allow you to connect to sqlite database on Android
 */

class SqliteAccess implements IDatabase {
    /**
     * Default constructor
     * @param db android.database.sqlite.SQLiteDatabase
     * @param returnType ReturnType
     */
    constructor(private db: android.database.sqlite.SQLiteDatabase, private returnType: ReturnType) {}

    /**
     * Insert a row into table with the values (key = columns and values = columns value)
     *
     * @param {string} tableName
     * @param {{ [key: string]: any; }} values
     *
     * @returns {number}  id inserted
     */
    insert(table: string, values: { [key: string]: any; }): number {
        return this.db.insert(table, null, __mapToContentValues(values));
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
    replace(table: string, values: { [key: string]: any; }): number {
        return this.db.replace(table, null, __mapToContentValues(values));
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
    update(table: string, values: { [key: string]: any; }, whereClause: string, whereArs: any[]): number {
        return this.db.update(table, __mapToContentValues(values), whereClause, __objectArrayToStringArray(whereArs));
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
    delete(table: string, whereClause?: string, whereArgs?: any[]): number {
        return this.db.delete(table, whereClause, __objectArrayToStringArray(whereArgs));
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
    select(sql: string, params?: any[]): ExtendedPromise {
        return new ExtendedPromise((subscribers, resolve, reject) => {
            try {
                const cursor =  this.db.rawQuery(sql, __objectArrayToStringArray(params));
                const result = __processCursor(cursor, this.returnType, subscribers.shift());
                resolve(result);
            } catch (ex) {
                reject(ex);
            }
        });
    }

    selectAsCursor(sql: string, params?: any[]) {
        return __processCursorReturnGenerator(
            this.db.rawQuery(sql, __objectArrayToStringArray(params)),
            this.returnType
        );
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
    query(param: { tableName: string, columns?: string[], selection?: string, selectionArgs?: any[], groupBy?: string, orderBy?: string, limit?: string }): ExtendedPromise {
        return new ExtendedPromise((subscribers, resolve, error) => {
            try {
                const cursor =  this.db.query(
                    param.tableName,
                    param.columns,
                    param.selection,
                    __objectArrayToStringArray(param.selectionArgs),
                    param.groupBy,
                    param.orderBy,
                    param.limit);
                const result = <Array<any>>__processCursor(cursor, this.returnType, subscribers.shift());
                resolve(result);
            } catch (ex) {
                error(ex);
            }
        });
    }

    queryAsCursor(param: { tableName: string, columns?: string[], selection?: string, selectionArgs?: any[], groupBy?: string, orderBy?: string, limit?: string }) {
        const cursor =  this.db.query(
            param.tableName,
            param.columns,
            param.selection,
            __objectArrayToStringArray(param.selectionArgs),
            param.groupBy,
            param.orderBy,
            param.limit);
        return __processCursorReturnGenerator(cursor, this.returnType);
    }

    /**
     * Execute a SQL script and do not return anything
     * @param sql
     */
    execSQL(sql: string) {
        this.db.execSQL(sql);
    }

    /**
     * Open a transaction
     */
    beginTransact() {
        this.db.beginTransaction();
    }

    /**
     * Commit the transaction
     */
    commit() {
        this.db.setTransactionSuccessful();
        this.db.endTransaction();
    }

    /**
     * Rollback a transaction
     */
    rollback() {
        this.db.endTransaction();
    }

    /**
     * Close the database connection
     */
    close(): void {
        if (this.db === null) { // already closed
            return;
        }

        this.db.close();
        this.db = null;
    }

    isClose(): boolean {
        return this.db === null;
    }
}

/** private function
 * Curring function to loop android.database.Cursor
 * @param cursor android.database.Cursor
 * @param returnType: ReturnType
 *
 * @returns any;
 */
function __processCursor(cursor: android.database.Cursor, returnType: ReturnType, reduceOrMapSub?: any) {
    let result: Array<any> | {} = (reduceOrMapSub && reduceOrMapSub.initialValue) || [];
    if (cursor.getCount() > 0) {
        let dbValue = null;
        while ( cursor.moveToNext() ) {
            dbValue = __getRowValues(cursor, returnType);
            if (reduceOrMapSub) {
                if (reduceOrMapSub.initialValue) {
                    result = reduceOrMapSub.callback(result, dbValue, cursor.getPosition());
                    continue;
                }
                dbValue = reduceOrMapSub.callback(dbValue, cursor.getPosition());
            }
            (<Array<any>>result).push( dbValue );
        }
    }
    cursor.close();

    return result;
}

function* __processCursorReturnGenerator(cursor: android.database.Cursor, returnType: ReturnType) {
    if (cursor.getCount() > 0) {
        while ( cursor.moveToNext() ) {
            yield __getRowValues(cursor, returnType);
        }
    }
    cursor.close();
}

/** private function
 * Process the sqlite cursor and return a
 * js object with column/value or an array row
 *
 * @param cursor android.database.Cursor
 * @param returnType ReturnType
 * @returns JS array of object like {[column:string]: any} or Array<any>.
 */
function __getRowValues(cursor: android.database.Cursor, returnType: ReturnType): any {

    const rowValue: Array<unknown> | Record<string, unknown> = returnType === ReturnType.AS_ARRAY ?  [] : {};
    const columnCount: number = cursor.getColumnCount();
    const fn = (col: number) => cursor.getString(col);

    for (let i = 0; i < columnCount; i++) {
        const value = readDbValue(cursor.getType(i), i, fn);

        // If result wanted as array of array
        if (returnType === ReturnType.AS_ARRAY) {
            (rowValue as Array<unknown>).push(value);
            continue;
        }

        rowValue[cursor.getColumnName(i)] = value;
    }

    return rowValue;
}

/** private function
 * open or create a read-write database, permanently or in memory
 * @param dbName string database name
 * @param mode number openness mode
 * @returns android.database.sqlite.SQLiteDatabase
 */
function __openCreateDataBase(dbName: string, mode: number): android.database.sqlite.SQLiteDatabase {
    if (dbName === ":memory:") {
        return android.database.sqlite.SQLiteDatabase.create(null);
    }
    // Getting a native File object
    const file: java.io.File = <java.io.File>__getContext().getDatabasePath(dbName);
    // Check if database file does not exist, then create dir
    if (!file.exists()) {
        file.getParentFile().mkdirs();
        file.getParentFile().setReadable(true);
        file.getParentFile().setWritable(true);
    }

    mode =  mode | android.database.sqlite.SQLiteDatabase.CREATE_IF_NECESSARY;
    return android.database.sqlite.SQLiteDatabase.openDatabase(file.getAbsolutePath(), null, mode);
}

/** private function
 * Turn an Array of any to Array of string to match android API
 * @param params Array<any> sql queries params
 * @returns Array<string>
 */
function __objectArrayToStringArray(params: Array<unknown>) {
    if (!params) return null;

    let stringArray: Array<string> = [];
    let value = null;
    for (let i = 0, len = params.length; i < len; i++) {
        value = parseToDbValue(params[i]);
        if (value === null) {
            stringArray.push( value );
            continue;
        }
        stringArray.push( value.toString().replace(/''/g, "'").replace(/^'|'$/g, '') );
    }
    return stringArray;
}

/**
 * Map a key/value JS object to android.content.ContentValues
 * @param values { [key: string]: any; }
 * @returns android.content.ContentValues
 */
function __mapToContentValues(values: { [key: string]: unknown; }) {
    let contentValues = new android.content.ContentValues();
    let value = null;
    for (const key in values) {
        if (values.hasOwnProperty(key)) {
            value = parseToDbValue(values[key]);
            if (value === null) {
                contentValues.putNull(key);
                continue;
            }
            contentValues.put(key, value.toString().replace(/''/g, "'").replace(/^'|'$/g, ''));
        }
    }
    return contentValues;
}

/** private function
 * Get and return Android app Context
 */
function __getContext() {
    return (Application.android.context
            || (Application.getNativeApplication && Application.getNativeApplication()));
}

/**
 * Create an instance of android.database.sqlite.SQLiteDatabase, execute the dropping and creating tables scripts if exists
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

    // Make sure version be 1 or greater and returnType AS_OBJECT
    options = Object.assign({
        version: 1,
        returnType: ReturnType.AS_OBJECT
    }, options);

    const db = __openCreateDataBase(dbName, android.database.sqlite.SQLiteDatabase.OPEN_READWRITE);
    const curVersion = db.getVersion();

    try {
        if (options.version !== curVersion) {
            db.setVersion(options.version);
            runInitialDbScript(curVersion, options, (script) => db.execSQL(script));
        }
    } catch (error) {
        db.setVersion(curVersion);
        db.close();
        throw error;
    }

    return new SqliteAccess(db, options.returnType);
}

/**
 * Export ReturnType and DbCreationOptions
 */
export * from "./sqlite-access.common";