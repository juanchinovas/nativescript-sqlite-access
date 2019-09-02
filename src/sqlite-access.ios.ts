import { IDatabase } from './common/IDatabase';
import * as fs from "tns-core-modules/file-system"
import { DbCreationOptions, ReturnType } from './common/Common';

//Super private variable
let _db: interop.Reference<any>;
let _dataReturnedType: ReturnType;

/**
 * This class allow you to connect to sqlite database on Android|iOS
 */

class SqliteAccess implements IDatabase {

    /**
     * Default constuctor
     * @param db interop.Reference<any>
     * @param returnType ReturnType
     */
    constructor(db: interop.Reference<any>, 
        returnType: ReturnType) {
        _db = db;
        _dataReturnedType = returnType;
    }

    /**
     * Insert a row into table with the values and return the last
     * inserted id in the table
     * 
     * @param table 
     * @param values 
     * 
     * @returns number
     */
    insert(table: string, values: { [key: string]: any; }): number {
        this.execSQL(`INSERT INTO ${table} (${Object.keys(values).join(",")}) VALUES(${__mapToAddOrUpdateValues(values, true)})`);
        let value = sqlite3_last_insert_rowid(_db.value);
        return Number(value);
    }    
    
    /**
     * Replace a row in the table with the values and 
     * return the number of rows affeted
     * 
     * @param table 
     * @param values
     * 
     * @returns number 
     */
    replace(table: string, values: { [key: string]: any; }): number {
        this.execSQL(`REPLACE INTO ${table} (${Object.keys(values).join(",")}) VALUES(${__mapToAddOrUpdateValues(values, true)})`);
        let value = sqlite3_changes(_db.value);
        return Number(value);
    }

    /**
     * Update a row in the table with the values and the filters. 
     * return the number of rows affeted
     * 
     * @param table 
     * @param values
     * @param whereClause 
     * @param whereArs 
     * 
     * @returns number 
     */
    update(table: string, values: { [key: string]: any; }, whereClause: string, whereArs: any[]): number {
        whereClause = whereClause && "WHERE " + whereClause.replace(/\?/g, <any>__replaceQuestionMarkForParams(whereArs)) || "";
        this.execSQL(`UPDATE ${table} SET ${__mapToAddOrUpdateValues(values, false)} ${whereClause}`);
        let value = sqlite3_changes(_db.value);
        return Number(value);
    }

    /**
     * Delete a row from the table with the filter.
     * return the number of rows affeted
     * 
     * @param table 
     * @param whereClause? 
     * @param whereArgs?
     * 
     * @returns number
     */
    delete(table: string, whereClause?: string, whereArgs?: any[]): number {
        whereClause = whereClause && "WHERE " + whereClause.replace(/\?/g, <any>__replaceQuestionMarkForParams(whereArgs)) || "";
        this.execSQL(`DELETE FROM ${table} ${whereClause}`);
        let value = sqlite3_changes(_db.value);
        return Number(value);
    }

    /**
     * Execute a query selector
     * @param sql 
     * @param params 
     * 
     * @returns Promise<Array<any>>
     */
    select(sql: string, params?: any[]): Promise<Array<any>> {
        sql = sql.replace(/\?/g, <any>__replaceQuestionMarkForParams(params));
        return new Promise(function(resolve, error) {
            try {
                let cursor =  __execQueryAndReturnStatement(sql, _db);
                const __processCursor = __prepareToProcessCursor(cursor);
                const result = __processCursor(_dataReturnedType);
                resolve(result);
            } catch(ex) {
                error(ex)
            }
        });
    }

    /**
     * Execute a query selector
     * 
     * @param table 
     * @param columns 
     * @param selection 
     * @param selectionArgs 
     * @param groupBy 
     * @param orderBy 
     * @param limit 
     * 
     * @returns Promise<Array<any>>
     */
    query(table: string, columns?: string[], selection?: string, selectionArgs?: any[], groupBy?: string, orderBy?: string, limit?: string): Promise<Array<any>> {
        selection = selection && "WHERE " + selection.replace(/\?/g, <any>__replaceQuestionMarkForParams(selectionArgs)) || "";
        groupBy = groupBy && "GROUP BY " + groupBy || ""; 
        orderBy = orderBy && "ORDER BY " + orderBy || "";
        limit = limit && "LIMIT " + limit || "";
        const _columns = columns && columns.join(',') || `${table}.*`;
        let query = `SELECT ${_columns} FROM ${table} ${selection} ${groupBy} ${orderBy} ${limit}`;
        return new Promise(function(resolve, error) {
            try {
                let cursor =  __execQueryAndReturnStatement(query, _db);
                const __processCursor = __prepareToProcessCursor(cursor);
                const result = __processCursor(_dataReturnedType);
                resolve(result);
            } catch(ex) {
                error(`ErrCode:${ex}`);
            }
        });
    }
    /**
     * Execute a SQL script and do not return anything
     * @param sql 
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
        if (_db === null) { //already closed
            return; 
        }

        sqlite3_close(_db.value);
        _db = null;
    }
}

/** private function
 * Execute a sql script and return the sqlite3 statament object
 * @param sql 
 * @param dbPointer 
 * 
 * @returns sqlite3 statament object stepped
 * 
 * @throws
 * if sqlite3_prepare_v2 returns !== 0
 * if sqlite3_step !== 101
 */
function __execQueryAndReturnStatement(sql: string, dbPointer: interop.Reference<any>): any {
    let cursorRef = new interop.Reference<any>();
    let resultCode = sqlite3_prepare_v2(dbPointer.value, sql, -1, cursorRef, null);
    let applyStatamentCode  = sqlite3_step(cursorRef.value);
    if (resultCode !== 0 /*SQLITE_OK*/ || (applyStatamentCode !== 101/*SQLITE_DONE*/ && applyStatamentCode !== 100/*SQLITE_ROW*/)) {
        sqlite3_finalize(cursorRef.value);
        cursorRef.value = null
        cursorRef = null;

        throw NSString.stringWithUTF8String(sqlite3_errmsg(dbPointer.value)).toString();
    }
    return cursorRef.value;
}

/** private function
 * Return a function to replace the question mark in the 
 * query ith the values
 * 
 * @param whereParams 
 * @returns ()=>string|number
 */
function __replaceQuestionMarkForParams(whereParams: Array<any>): Function {
    let counter = 0;
    return ()=> {
        let arg = whereParams[counter++];
        return !!parseFloat(arg)? Number(arg): `'${arg}'`;
    };
}

/** private function
 * Curring funcion to loop android.database.Cursor
 * @param cursor android.database.Cursor
 * 
 * @returns (returnType: ReturnType) => Array<any>;
 */
function __prepareToProcessCursor(cursorRef: any): (returnType: ReturnType)=>Array<any> {
    return (returnType: ReturnType) => {
        const result = [];
        do {
            result.push( __getRowValues(cursorRef, returnType) );
        } while (sqlite3_step(cursorRef) !== 101/*SQLITE_DONE*/);
            
        sqlite3_finalize(cursorRef);
        return result;
    }
}

/** private function
 * Process the sqlite cursor and return a 
 * js object with column/value or an array row
 * 
 * @param cursor 
 * @param returnType 
 * @returns JS  array or object like {[column:string]: any}
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
                break;
            case 4/*FIELD_TYPE_BLOB*/:
                //uncomment the code below if you wanna use it and change continue for break
                /*NSData.dataWithBytesLength(sqlite3_column_blob(cursor, i), sqlite3_column_bytes(cursor, i)/*length* /);
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
 * open or create a readwrite database, permanently or in memory
 * @param dbName database name
 * @param mode openness mode
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

/** private function
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
            let value =  values[key];
            value = !!parseFloat(value)? Number(value): `'${value}'`
            contentValues.push(inserting && value || `${key}=${value}`);
        }
    }
    return contentValues.join(",");
}

/**
 * Create an instance of qlite3*, execute the dropping and creating tables scripts if exists
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
export function DbBuilder(dbName: string, options?: DbCreationOptions) : SqliteAccess {
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
            if (tableDroptScripts) {
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
 * @param version 
 * 
 * @returns number|undefine
 */
function __dbVersion(db:any, version?: number) {
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
 * execute a sql query and return the fisrt row
 * @param db sqlite3*
 * @param query 
 * 
 * @return Array<any>
 */
function __execQueryReturnOneArrayRow(db: any, query: string): any {
    const cursorRef = __execQueryAndReturnStatement(query, db);
    const __processCursor = __prepareToProcessCursor(cursorRef);
    let result = __processCursor(ReturnType.AS_ARRAY);
    return result.shift();
}

/**
 * Export ReturnType and DbCreationOptions
 */
export * from "./common/Common";