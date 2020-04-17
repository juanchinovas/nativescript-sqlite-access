import * as app from "tns-core-modules/application";
import { DbCreationOptions, ReturnType, IDatabase, parseToDbValue, parseToJsValue, ExtendedPromise } from './sqlite-access.common';

// Super private variables
let _db: android.database.sqlite.SQLiteDatabase;
let _dataReturnedType: ReturnType;

/**
 * This class allow you to connect to sqlite database on Android
 */

class SqliteAccess implements IDatabase {

    /**
     * Default constructor
     * @param db android.database.sqlite.SQLiteDatabase
     * @param returnType ReturnType
     */
    constructor(db: android.database.sqlite.SQLiteDatabase, returnType: ReturnType) {
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
    insert(table: string, values: { [key: string]: any; }): number {
        return _db.insert(table, null, __mapToContentValues(values));
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
        return _db.replace(table, null, __mapToContentValues(values));
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
        console.log( __objectArrayToStringArray(whereArs));
        return _db.update(table, __mapToContentValues(values), whereClause, __objectArrayToStringArray(whereArs));
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
        return _db.delete(table, whereClause, __objectArrayToStringArray(whereArgs));
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
        return new ExtendedPromise(function(subscribers, resolve, reject) {
            try {
                let cursor =  _db.rawQuery(sql, __objectArrayToStringArray(params));
                const result = __processCursor(cursor, _dataReturnedType, subscribers.shift());
                resolve(result);
            } catch (ex) {
                reject(ex);
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
    query(table: string, columns?: string[], selection?: string, selectionArgs?: any[], groupBy?: string, orderBy?: string, limit?: string): ExtendedPromise {
        return new ExtendedPromise(function(subscribers, resolve, error) {
            let cursor =  _db.query(table, columns, selection, __objectArrayToStringArray(selectionArgs), groupBy, orderBy, limit);
            try {
                const result = <Array<any>>__processCursor(cursor, _dataReturnedType, subscribers.shift());
                resolve(result);
            } catch (ex) {
                error(ex);
            }
        });
    }

    /**
     * Execute a SQL script and do not return anything
     * @param sql
     */
    execSQL(sql: string) {
        _db.execSQL(sql);
    }

    /**
     * Open a transaction
     */
    beginTransact() {
        _db.beginTransaction();
    }

    /**
     * Commit the transaction
     */
    commit() {
        _db.setTransactionSuccessful();
        _db.endTransaction();
    }

    /**
     * Rollback a transaction
     */
    rollback() {
        _db.endTransaction();
    }

    /**
     * Close the database connection
     */
    close(): void {
        if (_db === null) { // already closed
            return;
        }

        _db.close();
        _db = null;
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
    let result: Array<any> | {} = reduceOrMapSub && reduceOrMapSub.initialValue || [];
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

/** private function
 * Process the sqlite cursor and return a
 * js object with column/value or an array row
 *
 * @param cursor android.database.Cursor
 * @param returnType ReturnType
 * @returns JS array of object like {[column:string]: any} or Array<any>.
 */
function __getRowValues(cursor: android.database.Cursor, returnType: ReturnType): any {

    let rowValue: any = {};
    if (returnType === ReturnType.AS_ARRAY) {
        rowValue = [];
    }

    let primitiveType = null;
    let columnName = '';
    let value = null;
    let columnCount: number = cursor.getColumnCount();
    for (let i = 0; i < columnCount; i++) {
        primitiveType = cursor.getType(i);
        columnName = cursor.getColumnName(i);
        switch (primitiveType) {
            case android.database.Cursor.FIELD_TYPE_INTEGER:
                value = cursor.getLong(i);
                break;
            case android.database.Cursor.FIELD_TYPE_FLOAT:
                value = Number(cursor.getString(i));
                break;
            case android.database.Cursor.FIELD_TYPE_STRING:
                value = cursor.getString(i);
                value = parseToJsValue(value);
                break;
            case android.database.Cursor.FIELD_TYPE_BLOB:
                // uncomment the code below if you wanna use it and change continue for break
                // value = cursor.getBlob(i);
                continue;
            case android.database.Cursor.FIELD_TYPE_NULL:
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
function __objectArrayToStringArray(params: Array<any>) {
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
function __mapToContentValues(values: { [key: string]: any; }) {
    let contentValues = new android.content.ContentValues();
    let value = null;
    for (const key in values) {
        if (values.hasOwnProperty(key)) {
            value = parseToDbValue(values[key]);
            if (value === null) {
                contentValues.putNull(key);
                continue;
            }
            contentValues.put(key, value.toString().replace(/''/g, "'").replace(/^'|'$/g,' '));
        }
    }
    return contentValues;
}

/** private function
 * Get and return Android app Context
 */
function __getContext() {
    return (app.android.context
            || (app.getNativeApplication && app.getNativeApplication()));
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

    options = options || {
        version: 1
    };
    // Ensure version be 1 or greater and returnType AS_OBJECT
    options.version = options.version || 1;
    options.returnType = options.returnType || ReturnType.AS_OBJECT;

    const db = __openCreateDataBase(dbName, android.database.sqlite.SQLiteDatabase.OPEN_READWRITE);
    const curVersion = db.getVersion();
    if (options.version > curVersion) {
        db.setVersion(options.version);
        const tableCreateScripts = options.createTableScriptsFn && options.createTableScriptsFn();
        const tableDroptScripts = options.dropTableScriptsFn && options.dropTableScriptsFn();

        try {
            // Dropping all tables
            if (tableDroptScripts && curVersion > 0) {
                for (let script in tableDroptScripts) {
                    db.execSQL(tableDroptScripts[script]);
                }
            }
            // Creating all tables
            if (tableCreateScripts) {
                for (let script in tableCreateScripts) {
                    db.execSQL(tableCreateScripts[script]);
                }
            }
        } catch (error) {
            db.setVersion(curVersion);
            db.close();
            throw error;
        }

    } else if (options.version < curVersion) {
        db.close();
        throw `It is not possible to set the version ${options.version} to database, because is lower then current version, Db current version is ${curVersion}`;
    }
    return new SqliteAccess(db, options.returnType);
}

/**
 * Export ReturnType and DbCreationOptions
 */
export * from "./sqlite-access.common";