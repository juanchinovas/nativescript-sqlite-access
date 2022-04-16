import { Application } from "@nativescript/core";
import { parseToDbValue, QueryProcessor, runInitialDbScript, readDbValue, replaceQuestionMark } from "./sqlite-access.common";
class SqliteAccess {
    constructor(db, returnType) {
        this.db = db;
        this.returnType = returnType;
    }
    insert(tableName, values) {
        return this.db.insert(tableName, null, __mapToContentValues(values));
    }
    async upsert(tableName, values) {
        const keyColumns = await this.select(`pragma table_info('${tableName}')`).process((list, item) => {
            if (item.pk) {
                list.push(item.name);
            }
            return list;
        }, []);
        if (!keyColumns.length) {
            throw new Error(`${tableName} doesn't have primary key columns`);
        }
        const whereClause = keyColumns.map(key => `${key}=?`).join(" AND ");
        const whereArgs = keyColumns.map(key => values[key]);
        const affectedRow = this.update(tableName, values, whereClause, whereArgs);
        if (!affectedRow) {
            return this.insert(tableName, values);
        }
        return (whereArgs.length === 1 && whereArgs.pop()) || whereArgs;
    }
    replace(tableName, values) {
        return this.db.replace(tableName, null, __mapToContentValues(values));
    }
    update(tableName, values, whereClause, whereArgs) {
        return this.db.update(tableName, __mapToContentValues(values), replaceQuestionMark(whereClause, whereArgs), null);
    }
    delete(tableName, whereClause, whereArgs) {
        return this.db.delete(tableName, replaceQuestionMark(whereClause, whereArgs), null);
    }
    select(sql, params) {
        return new QueryProcessor((transformerAgent, resolve, reject) => {
            try {
                const cursor = this.db.rawQuery(replaceQuestionMark(sql, params) || sql, null);
                if (transformerAgent && transformerAgent.type === 1) {
                    return resolve(__processCursorReturnGenerator(cursor, this.returnType, transformerAgent));
                }
                resolve(__processCursor(cursor, this.returnType, transformerAgent));
            }
            catch (ex) {
                reject(ex);
            }
        });
    }
    query(param) {
        return new QueryProcessor((transformerAgent, resolve, error) => {
            try {
                const cursor = this.db.query(param.tableName, param.columns, replaceQuestionMark(param.selection, param.selectionArgs), null, param.groupBy, param.having, param.orderBy, param.limit);
                if (transformerAgent && transformerAgent.type === 1) {
                    return resolve(__processCursorReturnGenerator(cursor, this.returnType, transformerAgent));
                }
                resolve(__processCursor(cursor, this.returnType, transformerAgent));
            }
            catch (ex) {
                error(ex);
            }
        });
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
        if (this.isClose()) {
            return;
        }
        this.db.close();
        this.db = null;
    }
    isClose() {
        return this.db === null;
    }
}
function __processCursor(cursor, returnType, transformerAgent) {
    let result = (transformerAgent && transformerAgent.initialValue) || [];
    if (cursor.getCount() > 0) {
        let dbValue = null;
        while (cursor.moveToNext()) {
            dbValue = __getRowValues(cursor, returnType);
            if (transformerAgent && transformerAgent.transform) {
                if (transformerAgent.initialValue) {
                    result = transformerAgent.transform(result, dbValue, cursor.getPosition());
                    continue;
                }
                dbValue = transformerAgent.transform(dbValue, cursor.getPosition());
            }
            result.push(dbValue);
        }
    }
    cursor.close();
    return result;
}
function* __processCursorReturnGenerator(cursor, returnType, transformerAgent) {
    if (cursor.getCount() > 0) {
        while (cursor.moveToNext()) {
            const row = __getRowValues(cursor, returnType);
            if (transformerAgent && transformerAgent.transform) {
                yield transformerAgent.transform(row, cursor.getPosition());
                continue;
            }
            yield row;
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
function __mapToContentValues(values) {
    const contentValues = new android.content.ContentValues();
    let value = null;
    for (const key in values) {
        if (Object.prototype.hasOwnProperty.call(values, key)) {
            value = parseToDbValue(values[key]);
            if (value === null) {
                contentValues.putNull(key);
                continue;
            }
            contentValues.put(key, value.toString().replace(/''/g, "'").replace(/^'|'$/g, ""));
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
        throw new Error("Must specify a db name");
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