import { IDatabase } from './common/IDatabase';
import * as app from "tns-core-modules/application";
import { DbCreationOptions, ReturnType } from './common/Common';

class SqliteAccess implements IDatabase {
    
    private _db: android.database.sqlite.SQLiteDatabase;
    private _options: DbCreationOptions;
    constructor(db: android.database.sqlite.SQLiteDatabase, 
        options: DbCreationOptions) {
        this._db = db;
        this._options = options;
    }

    insert(table: string, values: { [key: string]: any; }): number {
        return this._db.insert(table, null, __mapToContentValues(values));
    }    
    
    replace(table: string, values: { [key: string]: any; }): number {
        return this._db.replace(table, null, __mapToContentValues(values));
    }

    update(table: string, values: { [key: string]: any; }, whereClause: string, whereArs: any[]): number {
        return this._db.update(table, __mapToContentValues(values), whereClause, __objectArrayToStringArray(whereArs));
    }

    delete(table: string, whereClause: string, whereArs: any[]): number {
        return this._db.delete(table, whereClause, __objectArrayToStringArray(whereArs));
    }

    select(sql: string, params?: any[]): Promise<Array<any>> {
        const me = this;
        return new Promise(function(resolve, error) {
            let cursor =  me._db.rawQuery(sql, __objectArrayToStringArray(params));
            try {
                const toArrayOfObject = __processCursor(cursor);
                const result = toArrayOfObject(me._options.returnType);
                resolve(result);
            } catch(ex) {
                error(ex)
            }
        });
    }

    query(table: string, columns?: string[], selection?: string, selectionArgs?: any[], groupBy?: string, orderBy?: string, limit?: string): Promise<Array<any>> {
        const me = this;
        return new Promise(function(resolve, error) {
            let cursor =  me._db.query(table, columns, selection, __objectArrayToStringArray(selectionArgs), groupBy, orderBy, limit);
            try {
                const toArrayOfObject = __processCursor(cursor);
                const result = toArrayOfObject(me._options.returnType);
                resolve(result);
            } catch(ex) {
                error(ex)
            }
        });
    }

    execSQL(sql: string) {
        this._db.execSQL(sql);
    }

    beginTransact() {
        this._db.beginTransaction();
    }

    commit() {
        this._db.setTransactionSuccessful();
        this._db.endTransaction();
    }

    rollback() {
        this._db.endTransaction();
    }

    close(): void {
        this._db.close();
        this._db = null;
    }
}


function __processCursor(cursor: android.database.Cursor) {
    return (returnType: ReturnType) => {
        const result = [];
        if (cursor.getCount() > 0) {
            while ( cursor.moveToNext() ) {
                result.push( __getRowValues(cursor, returnType) );
            }
        }
        cursor.close();
        return result;
    }
}

/**
 * Process the sqlite cursor and return a js object with column/value
 * @param cursor 
 * @param columnCount 
 * @returns JS object like {[column:string]: any}
 */
function __getRowValues(cursor: android.database.Cursor, returnType: ReturnType): any {

    let rowValue: any = {};
    if (returnType === ReturnType.AS_ARRAY) {
        rowValue = [];
    }

    let primitiveType = null;
    let columnName = '';
    let value = null;
    let columnCount:number = cursor.getColumnCount();
    for (let i = 0; i < columnCount; i++) {
        primitiveType = cursor.getType(i);
        columnName = cursor.getColumnName(i);
        switch (primitiveType) {
            case android.database.Cursor.FIELD_TYPE_INTEGER: 
                value = cursor.getLong(i);
                break;
            case android.database.Cursor.FIELD_TYPE_FLOAT: 
                value = cursor.getFloat(i);
                break;
            case android.database.Cursor.FIELD_TYPE_NULL:
                value = null;
                break;
            case android.database.Cursor.FIELD_TYPE_BLOB:
                value = cursor.getBlob(i);
                break;
            case android.database.Cursor.FIELD_TYPE_STRING: 
                value = cursor.getString(i);    
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
    if (dbName === ":memory:") {
        return android.database.sqlite.SQLiteDatabase.create(null);
    }

    dbName = __getContext().getDatabasePath(dbName).getAbsolutePath().toString();
    mode =  mode | android.database.sqlite.SQLiteDatabase.CREATE_IF_NECESSARY;
    return android.database.sqlite.SQLiteDatabase.openDatabase(dbName, null, mode);
}

function __objectArrayToStringArray(params: Array<any>) {
    if (!params) return null;

    let stringArray:Array<string> = [];
    for(let key in params) {
        stringArray.push( params[key] && params[key].toString() || null );
    }
    return stringArray;
}

function __mapToContentValues(values: { [key: string]: any; }) {
    let contentValues = new android.content.ContentValues();
    for (const key in values) {
        if (values.hasOwnProperty(key) 
            && values[key] !== null && values[key] !== undefined) {
            contentValues.put(key, values[key]);
        } else {
            contentValues.putNull(key);
        }
    }
    return contentValues;
}

function __getContext() {
    return (app.android.context 
            || (app.getNativeApplication && app.getNativeApplication()));
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

    const db = __openCreateDataBase(dbName, android.database.sqlite.SQLiteDatabase.OPEN_READWRITE);
    const curVersion = db.getVersion();
    console.log(`db v: ${curVersion}, ${options.version}`);
    if (options.version > curVersion) {
        db.setVersion(options.version);
        const tableCreateScripts = options.createTableScriptsFn && options.createTableScriptsFn();
        const tableDroptScripts = options.dropTableScriptsFn && options.dropTableScriptsFn();
        
        try {
            console.log("script", tableCreateScripts);
            // Dropping all tables
            if (tableDroptScripts) {
                for (let script in tableDroptScripts) {
                    db.execSQL(tableDroptScripts[script]);
                }
            }
            console.log("drop", tableDroptScripts);
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
    return new SqliteAccess(db, options);
}