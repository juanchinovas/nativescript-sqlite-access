import { IDatabase } from './common/IDatabase';
import * as fs from "tns-core-modules/file-system"
import { DbCreationOptions, ReturnType } from './common/Common';

class SqliteAccess implements IDatabase {
    
    private _db: interop.Reference<any>;
    private _dataReturnedType: ReturnType;
    constructor(db: interop.Reference<any>, 
        returnType: ReturnType) {
        this._db = db;
        this._dataReturnedType = returnType;
    }

    insert(table: string, values: { [key: string]: any; }): number {
        this.execSQL(`INSERT INTO ${table} (${Object.keys(values).join(",")}) VALUES(${__mapToContentValues(values, true)})`);
        return 1
    }    
    
    replace(table: string, values: { [key: string]: any; }): number {
        return this.insert(table, values);
    }

    update(table: string, values: { [key: string]: any; }, whereClause: string, whereArs: any[]): number {
        whereClause = whereClause && "WHERE " + whereClause.replace(/\?/g, <any>__replaceQuestionMarkForParams(whereArs)) || "";
        this.execSQL(`UPDATE ${table} SET ${__mapToContentValues(values, false)} ${whereClause}`);
        return 1;
    }

    delete(table: string, whereClause?: string, whereArs?: any[]): number {
        whereClause = whereClause && "WHERE " + whereClause.replace(/\?/g, <any>__replaceQuestionMarkForParams(whereArs)) || "";
        this.execSQL(`DELETE FROM ${table} ${whereClause}`);
        return 1;
    }

    select(sql: string, params?: any[]): Promise<Array<any>> {
        const me = this;
        sql = sql.replace(/\?/g, <any>__replaceQuestionMarkForParams(params));
        return new Promise(function(resolve, error) {
            try {
                let cursor =  __execQueryAndReturnStatement(sql, me._db);
                const __processCursor = __prepareToProcessCursor(cursor);
                const result = __processCursor(me._dataReturnedType);
                resolve(result);
            } catch(ex) {
                error(ex)
            }
        });
    }

    query(table: string, columns?: string[], selection?: string, selectionArgs?: any[], groupBy?: string, orderBy?: string, limit?: string): Promise<Array<any>> {
        const me = this;
        selection = selection && "WHERE " + selection.replace(/\?/g, <any>__replaceQuestionMarkForParams(selectionArgs)) || "";
        groupBy = groupBy && "GROUP BY " + groupBy || ""; 
        orderBy = orderBy && "ORDER BY " + orderBy || "";
        limit = limit && "LIMIT " + limit || "";
        const _columns = columns && columns.join(',') || '*';
        let query = `SELECT ${_columns} FROM ${table} ${selection} ${groupBy} ${orderBy} ${limit}`;
        return new Promise(function(resolve, error) {
            try {
                let cursor =  __execQueryAndReturnStatement(query, me._db);
                const __processCursor = __prepareToProcessCursor(cursor);
                const result = __processCursor(me._dataReturnedType);
                resolve(result);
            } catch(ex) {
                error(ex)
            }
        });
    }

    execSQL(sql: string) {
        let cursorRef: interop.Reference<any>;
        try {
            cursorRef = __execQueryAndReturnStatement(sql, this._db);
            sqlite3_finalize(cursorRef);
        } catch(ex) {
            throw `Error while executing script #${ex.message}`;
        }
    }

    beginTransact() {
        this.execSQL("BEGIN TRANSACTION");
    }

    commit() {
        this.execSQL("COMMIT TRANSACTION");
    }

    rollback() {
        this.execSQL("ROLLBACK TRANSACTION");
    }

    close(): void {
        sqlite3_close(this._db);
        this._db = null;
    }
}

function __execQueryAndReturnStatement(sql: string, dbPointer: interop.Reference<any>): interop.Reference<any> {
    let cursorRef = new interop.Reference<any>();
    let resultCode = sqlite3_prepare_v2(dbPointer, sql, -1, cursorRef, null);
    if (resultCode !== 0 /*SQLITE_OK*/) {
        sqlite3_finalize(cursorRef.value);
        cursorRef.value = null
        cursorRef = null;

        throw resultCode;
    }
    return cursorRef.value;
}

function __replaceQuestionMarkForParams(whereParams: Array<any>): Function {
    let counter = 0;
    return ()=> {
        let arg = whereParams[counter++];
        return !!parseFloat(arg)? Number(arg): `'${arg}'`;
    };
}


function __prepareToProcessCursor(cursorRef: any): (returnType: ReturnType)=>Array<any> {
    return (returnType: ReturnType) => {
        const result = [];
        while (sqlite3_step(cursorRef) !== 101/*SQLITE_DONE*/) {
            result.push( __getRowValues(cursorRef, returnType) );
        }
        sqlite3_finalize(cursorRef);
        return result;
    }
}

/**
 * Process the sqlite cursor and return a js object with column/value
 * @param cursor 
 * @returns JS object like {[column:string]: any}
 */
function __getRowValues(cursor: any, returnType: ReturnType): any {

    let rowValue: any = {};
    if (returnType === ReturnType.AS_ARRAY) {
        rowValue = [];
    }

    let primitiveType = null;
    let columnName = '';
    let value = null;
    let columnCount:number = sqlite3_column_count(cursor);

    for (let i = 0; i < columnCount; i++) {
        primitiveType = sqlite3_column_type(cursor, i);
        columnName = sqlite3_column_name(cursor, i);
        switch (primitiveType) {
            case android.database.Cursor.FIELD_TYPE_INTEGER: 
                value = sqlite3_column_int64(cursor, i);
                break;
            case android.database.Cursor.FIELD_TYPE_FLOAT: 
                value = sqlite3_column_double(cursor, i);
                break;
            case android.database.Cursor.FIELD_TYPE_NULL:
                value = null;
                break;
            case android.database.Cursor.FIELD_TYPE_BLOB:
                value = sqlite3_column_blob(cursor, i);
                break;
            case android.database.Cursor.FIELD_TYPE_STRING: 
                value = sqlite3_column_text(cursor, i);    
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


function __openCreateDataBase(dbName: string, mode: number) {
    const dbInstance = new interop.Reference<any>();
    let resultCode: number = 0;
    if (dbName === ":memory:") {
        resultCode = sqlite3_open_v2(dbName, dbInstance, mode | 0x00000080 /*SQLITE_OPEN_MEMORY*/, null);
    } else {
        mode =  mode | 0x00000004 /*SQLITE_OPEN_CREATE*/;
        resultCode = sqlite3_open_v2(dbName, dbInstance, mode, null);
    }

    if (resultCode !== 0 /*SQLITE_OK*/) {
        throw `Could not open database. sqlite error code ${resultCode}`;
    }
    
    return dbInstance.value;
}

function __mapToContentValues(values: { [key: string]: any; }, inserting: boolean = true) {
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

export function DbBuilder(dbName: string, options?: DbCreationOptions) : SqliteAccess {
    if (!dbName) throw "Must specify a db name";

    console.dir(options);
    options = options || {
        version: 1
    };
    // Ensure version be 1 or greater and returnType AS_OBJECT
    options.version = options.version || 1;
    options.returnType = options.returnType || ReturnType.AS_OBJECT;

    const db = __openCreateDataBase(dbName, 0x00000002/*SQLITE_OPEN_READWRITE*/);
    const curVersion = __dbVersion(db);
    console.log(`db v: ${curVersion}, ${options.version}`);
    if (options.version > curVersion) {
        __dbVersion(db, options.version);
        const tableCreateScripts = options.createTableScriptsFn && options.createTableScriptsFn();
        const tableDroptScripts = options.dropTableScriptsFn && options.dropTableScriptsFn();
        
        try {
            console.log("script", tableCreateScripts);
            // Dropping all tables
            if (tableDroptScripts) {
                for (let script in tableDroptScripts) {
                    const cursorRef = __execQueryAndReturnStatement(tableDroptScripts[script], db);
                    sqlite3_finalize(cursorRef);
                }
            }
            console.log("drop", tableDroptScripts);
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

    } else if (options.version < curVersion) {
        db.close();
        throw `It is not possible to set the version ${options.version} to database, because is lower then current version, Db current version is ${curVersion}`;
    }
    return new SqliteAccess(db, options.returnType);
}

function __dbVersion(db:any, version?: number) {
    let sql = "PRAGMA user_version";
    
    if (!!version) {
        const cursorRef = __execQueryAndReturnStatement(sql, db);
        const __processCursor = __prepareToProcessCursor(cursorRef);
        version = __processCursor(ReturnType.AS_ARRAY).pop();
        sqlite3_finalize(cursorRef);
    } else {
        sql += `=${version}`;
        const cursorRef = __execQueryAndReturnStatement(sql, db);
        sqlite3_finalize(cursorRef);
    }
    return version;
}