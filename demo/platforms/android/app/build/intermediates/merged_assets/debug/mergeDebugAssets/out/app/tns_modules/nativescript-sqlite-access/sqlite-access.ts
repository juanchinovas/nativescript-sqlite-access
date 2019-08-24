import { IDatabase } from './common/IDatabase';

class SqliteAccess implements IDatabase {
    
    private _db: android.database.sqlite.SQLiteDatabase;
    constructor(db: android.database.sqlite.SQLiteDatabase) {
        this._db = db;
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

    select(sql: string, params: any[]): Promise<Array<any>> {
        const me = this;
        return new Promise(function(resolve, error) {
            let cursor =  me._db.rawQuery(sql, __objectArrayToStringArray(params));
            try {
                const toArrayOfObject = __processCursor(cursor);
                const result = toArrayOfObject();
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
                const result = toArrayOfObject();
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

    close(): void {
        this._db.close();
        this._db = null;
    }
}


function __processCursor(cursor: android.database.Cursor) {
    return () => {
        const result = [];
        if (cursor.getCount() > 0) {
            while ( cursor.moveToNext() ) {
                result.push( __getRowValues(cursor, cursor.getColumnCount()) );
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
function __getRowValues(cursor: android.database.Cursor, columnCount:number): any {
    let rowValue = {};
    let valueType = null;
    let columnName = '';
    for (let i = 0; i < columnCount; i++) {
        valueType = cursor.getType(i);
        columnName = cursor.getColumnName(i);
        switch (valueType) {
            case android.database.Cursor.FIELD_TYPE_INTEGER: 
                rowValue[columnName] = cursor.getLong(i);
                break;
            case android.database.Cursor.FIELD_TYPE_FLOAT: 
                rowValue[columnName] = cursor.getFloat(i);
                break;
            case android.database.Cursor.FIELD_TYPE_NULL:
                rowValue[columnName] = null;
                break;
            case android.database.Cursor.FIELD_TYPE_BLOB:
                rowValue[columnName] = cursor.getBlob(i);
                break;
            case android.database.Cursor.FIELD_TYPE_STRING: 
                rowValue[columnName] = cursor.getString(i);    
                break;
        }
    }
    return rowValue;
}


function __openCreateDataBase(dbName: string, mode: number) {
    if (dbName === ":memory:") {
        return android.database.sqlite.SQLiteDatabase.create(null);
    }

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
        if (values.hasOwnProperty(key) && values[key]) {
            contentValues.put(key, values[key]);
        } else {
            contentValues.putNull(key);
        }
    }
    return contentValues;
}

export function builder(dbName: string) : SqliteAccess {
    return new SqliteAccess(__openCreateDataBase(dbName, android.database.sqlite.SQLiteDatabase.OPEN_READWRITE));
}