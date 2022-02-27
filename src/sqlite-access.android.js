import { Application } from "@nativescript/core";
import { parseToDbValue, ExtendedPromise, runInitialDbScript, readDbValue } from './sqlite-access.common';
class SqliteAccess {
    constructor(db, returnType) {
        this.db = db;
        this.returnType = returnType;
    }
    insert(table, values) {
        return this.db.insert(table, null, __mapToContentValues(values));
    }
    replace(table, values) {
        return this.db.replace(table, null, __mapToContentValues(values));
    }
    update(table, values, whereClause, whereArs) {
        return this.db.update(table, __mapToContentValues(values), whereClause, __objectArrayToStringArray(whereArs));
    }
    delete(table, whereClause, whereArgs) {
        return this.db.delete(table, whereClause, __objectArrayToStringArray(whereArgs));
    }
    select(sql, params) {
        return new ExtendedPromise((subscribers, resolve, reject) => {
            try {
                const cursor = this.db.rawQuery(sql, __objectArrayToStringArray(params));
                const result = __processCursor(cursor, this.returnType, subscribers.shift());
                resolve(result);
            }
            catch (ex) {
                reject(ex);
            }
        });
    }
    selectAsCursor(sql, params) {
        return __processCursorReturnGenerator(this.db.rawQuery(sql, __objectArrayToStringArray(params)), this.returnType);
    }
    query(param) {
        return new ExtendedPromise((subscribers, resolve, error) => {
            try {
                const cursor = this.db.query(param.tableName, param.columns, param.selection, __objectArrayToStringArray(param.selectionArgs), param.groupBy, param.orderBy, param.limit);
                const result = __processCursor(cursor, this.returnType, subscribers.shift());
                resolve(result);
            }
            catch (ex) {
                error(ex);
            }
        });
    }
    queryAsCursor(param) {
        const cursor = this.db.query(param.tableName, param.columns, param.selection, __objectArrayToStringArray(param.selectionArgs), param.groupBy, param.orderBy, param.limit);
        return __processCursorReturnGenerator(cursor, this.returnType);
    }
    execSQL(sql) {
        this.db.execSQL(sql);
    }
    beginTransact() {
        this.db.beginTransaction();
    }
    commit() {
        this.db.setTransactionSuccessful();
        this.db.endTransaction();
    }
    rollback() {
        this.db.endTransaction();
    }
    close() {
        if (this.db === null) {
            return;
        }
        this.db.close();
        this.db = null;
    }
    isClose() {
        return this.db === null;
    }
}
function __processCursor(cursor, returnType, reduceOrMapSub) {
    let result = (reduceOrMapSub && reduceOrMapSub.initialValue) || [];
    if (cursor.getCount() > 0) {
        let dbValue = null;
        while (cursor.moveToNext()) {
            dbValue = __getRowValues(cursor, returnType);
            if (reduceOrMapSub) {
                if (reduceOrMapSub.initialValue) {
                    result = reduceOrMapSub.callback(result, dbValue, cursor.getPosition());
                    continue;
                }
                dbValue = reduceOrMapSub.callback(dbValue, cursor.getPosition());
            }
            result.push(dbValue);
        }
    }
    cursor.close();
    return result;
}
function* __processCursorReturnGenerator(cursor, returnType) {
    if (cursor.getCount() > 0) {
        while (cursor.moveToNext()) {
            yield __getRowValues(cursor, returnType);
        }
    }
    cursor.close();
}
function __getRowValues(cursor, returnType) {
    const rowValue = returnType === 1 ? [] : {};
    const columnCount = cursor.getColumnCount();
    const fn = (col) => cursor.getString(col);
    for (let i = 0; i < columnCount; i++) {
        const value = readDbValue(cursor.getType(i), i, fn);
        if (returnType === 1) {
            rowValue.push(value);
            continue;
        }
        rowValue[cursor.getColumnName(i)] = value;
    }
    return rowValue;
}
function __openCreateDataBase(dbName, mode) {
    if (dbName === ":memory:") {
        return android.database.sqlite.SQLiteDatabase.create(null);
    }
    const file = __getContext().getDatabasePath(dbName);
    if (!file.exists()) {
        file.getParentFile().mkdirs();
        file.getParentFile().setReadable(true);
        file.getParentFile().setWritable(true);
    }
    mode = mode | android.database.sqlite.SQLiteDatabase.CREATE_IF_NECESSARY;
    return android.database.sqlite.SQLiteDatabase.openDatabase(file.getAbsolutePath(), null, mode);
}
function __objectArrayToStringArray(params) {
    if (!params)
        return null;
    let stringArray = [];
    let value = null;
    for (let i = 0, len = params.length; i < len; i++) {
        value = parseToDbValue(params[i]);
        if (value === null) {
            stringArray.push(value);
            continue;
        }
        stringArray.push(value.toString().replace(/''/g, "'").replace(/^'|'$/g, ''));
    }
    return stringArray;
}
function __mapToContentValues(values) {
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
function __getContext() {
    return (Application.android.context
        || (Application.getNativeApplication && Application.getNativeApplication()));
}
export function DbBuilder(dbName, options) {
    if (!dbName)
        throw "Must specify a db name";
    options = Object.assign({
        version: 1,
        returnType: 0
    }, options);
    const db = __openCreateDataBase(dbName, android.database.sqlite.SQLiteDatabase.OPEN_READWRITE);
    const curVersion = db.getVersion();
    try {
        if (options.version !== curVersion) {
            db.setVersion(options.version);
            runInitialDbScript(curVersion, options, (script) => db.execSQL(script));
        }
    }
    catch (error) {
        db.setVersion(curVersion);
        db.close();
        throw error;
    }
    return new SqliteAccess(db, options.returnType);
}
export * from "./sqlite-access.common";
//# sourceMappingURL=sqlite-access.android.js.map