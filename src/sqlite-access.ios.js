import { knownFolders } from "@nativescript/core/file-system";
import { parseToDbValue, QueryProcessor, runInitialDbScript, readDbValue } from "./sqlite-access.common";
class SqliteAccess {
    constructor(db, returnType) {
        this.db = db;
        this.returnType = returnType;
    }
    insert(tableName, values) {
        this.execSQL(`INSERT INTO ${tableName} (${Object.keys(values).join(",")}) VALUES(${__mapToAddOrUpdateValues(values, true)})`);
        const value = sqlite3_last_insert_rowid(this.db.value);
        return Number(value);
    }
    replace(tableName, values) {
        this.execSQL(`REPLACE INTO ${tableName} (${Object.keys(values).join(",")}) VALUES(${__mapToAddOrUpdateValues(values, true)})`);
        const value = sqlite3_changes(this.db.value);
        return Number(value);
    }
    update(tableName, values, whereClause, whereArs) {
        whereClause = (whereClause && "WHERE " + whereClause.replace(/\?/g, __replaceQuestionMarkForParams(whereArs))) || "";
        this.execSQL(`UPDATE ${tableName} SET ${__mapToAddOrUpdateValues(values, false)} ${whereClause}`);
        const value = sqlite3_changes(this.db.value);
        return Number(value);
    }
    delete(tableName, whereClause, whereArgs) {
        whereClause = (whereClause && "WHERE " + whereClause.replace(/\?/g, __replaceQuestionMarkForParams(whereArgs))) || "";
        this.execSQL(`DELETE FROM ${tableName} ${whereClause}`);
        const value = sqlite3_changes(this.db.value);
        return Number(value);
    }
    select(sql, conditionParams) {
        return new QueryProcessor((transformerAgent, resolve, error) => {
            try {
                sql = sql.replace(/\?/g, __replaceQuestionMarkForParams(conditionParams));
                const cursor = __execQueryAndReturnStatement(sql, this.db);
                if (transformerAgent && transformerAgent.type === 1) {
                    return resolve(__processCursorGenerator(cursor, this.returnType, transformerAgent));
                }
                resolve(__processCursor(cursor, this.returnType, transformerAgent));
            }
            catch (ex) {
                error(ex);
            }
        });
    }
    query(param) {
        return new QueryProcessor((transformerAgent, resolve, error) => {
            try {
                const cursor = __execQueryAndReturnStatement(__assembleScript(param), this.db);
                if (transformerAgent && transformerAgent.type === 1) {
                    return resolve(__processCursorGenerator(cursor, this.returnType, transformerAgent));
                }
                resolve(__processCursor(cursor, this.returnType, transformerAgent));
            }
            catch (ex) {
                error(ex);
            }
        });
    }
    execSQL(sql) {
        const cursorRef = __execQueryAndReturnStatement(sql, this.db);
        sqlite3_finalize(cursorRef);
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
    close() {
        if (this.isClose()) {
            return;
        }
        sqlite3_close(this.db.value);
        this.db = null;
    }
    isClose() {
        return this.db === null;
    }
}
function __execQueryAndReturnStatement(sql, dbPointer) {
    let cursorRef = new interop.Reference();
    const resultCode = sqlite3_prepare_v2(dbPointer.value, sql, -1, cursorRef, null);
    const applyStatementCode = sqlite3_step(cursorRef.value);
    if (resultCode !== 0 || (applyStatementCode !== 101 && applyStatementCode !== 100)) {
        sqlite3_finalize(cursorRef.value);
        cursorRef.value = null;
        cursorRef = null;
        throw new Error(NSString.stringWithUTF8String(sqlite3_errmsg(dbPointer.value)).toString());
    }
    return cursorRef.value;
}
function __assembleScript(param) {
    param.selection = (param.selection && "WHERE " + param.selection.replace(/\?/g, __replaceQuestionMarkForParams(param.selectionArgs))) || "";
    param.groupBy = (param.groupBy && "GROUP BY " + param.groupBy) || "";
    param.orderBy = (param.orderBy && "ORDER BY " + param.orderBy) || "";
    param.limit = (param.limit && "LIMIT " + param.limit) || "";
    const _columns = (param.columns && param.columns.join(",")) || `${param.tableName}.*`;
    return `SELECT ${_columns} FROM ${param.tableName} ${param.selection} ${param.groupBy} ${param.orderBy} ${param.limit}`;
}
function __replaceQuestionMarkForParams(whereParams) {
    let counter = 0;
    return () => parseToDbValue(whereParams[counter++]);
}
function __processCursor(cursorRef, returnType, transformerAgent) {
    let result = (transformerAgent && transformerAgent.initialValue) || [];
    let dbRow = null;
    if (sqlite3_data_count(cursorRef) > 0) {
        let counter = 0;
        do {
            dbRow = __getRowValues(cursorRef, returnType);
            if (transformerAgent && transformerAgent.transform) {
                if (transformerAgent.initialValue) {
                    result = transformerAgent.transform(result, dbRow, counter++);
                    continue;
                }
                dbRow = transformerAgent.transform(dbRow, counter++);
            }
            result.push(dbRow);
        } while (sqlite3_step(cursorRef) === 100);
    }
    sqlite3_finalize(cursorRef);
    return result;
}
function* __processCursorGenerator(cursorRef, returnType, transformerAgent) {
    if (sqlite3_data_count(cursorRef) > 0) {
        let counter = 0;
        do {
            const row = __getRowValues(cursorRef, returnType);
            if (transformerAgent && transformerAgent.transform) {
                yield transformerAgent.transform(row, counter++);
                continue;
            }
            yield row;
        } while (sqlite3_step(cursorRef) === 100);
    }
    sqlite3_finalize(cursorRef);
}
function __getRowValues(cursor, returnType) {
    const rowValue = returnType === 1 ? [] : {};
    const columnCount = sqlite3_column_count(cursor);
    const fn = (col) => NSString.stringWithUTF8String(sqlite3_column_text(cursor, col) || "").toString();
    for (let i = 0; i < columnCount; i++) {
        const value = readDbValue(sqlite3_column_type(cursor, i), i, fn);
        if (returnType === 1) {
            rowValue.push(value);
            continue;
        }
        let columnName = sqlite3_column_name(cursor, i);
        columnName = NSString.stringWithUTF8String(columnName).toString();
        rowValue[columnName] = value;
    }
    return rowValue;
}
function __openOrCreateDataBase(dbName, mode) {
    const dbInstance = new interop.Reference();
    let resultCode = 0;
    if (dbName === ":memory:") {
        resultCode = sqlite3_open_v2(dbName, dbInstance, mode | 296, null);
    }
    else {
        const dbDir = `${knownFolders.documents().path}/${dbName}`;
        mode = mode | 4;
        resultCode = sqlite3_open_v2(dbDir, dbInstance, mode, null);
    }
    if (resultCode !== 0) {
        throw new Error(`Could not open database. sqlite error code ${resultCode}`);
    }
    return dbInstance;
}
function __mapToAddOrUpdateValues(values, inserting) {
    const contentValues = [];
    for (const key in values) {
        if (Object.prototype.hasOwnProperty.call(values, key)) {
            const value = parseToDbValue(values[key]);
            contentValues.push(inserting ? value : `${key}=${value}`);
        }
    }
    return contentValues.join(",");
}
export function DbBuilder(dbName, options) {
    if (!dbName)
        throw new Error("Must specify a db name");
    options = Object.assign({
        version: 1,
        returnType: 0
    }, options);
    const db = __openOrCreateDataBase(dbName, 2);
    const currVersion = __dbVersion(db);
    try {
        if (options.version !== currVersion) {
            __dbVersion(db, options.version);
            runInitialDbScript(currVersion, options, (script) => {
                const cursorRef = __execQueryAndReturnStatement(script, db);
                sqlite3_finalize(cursorRef);
            });
        }
    }
    catch (error) {
        __dbVersion(db, currVersion);
        sqlite3_close(db);
        throw error;
    }
    return new SqliteAccess(db, options.returnType);
}
function __dbVersion(db, version) {
    const sql = "PRAGMA user_version";
    if (isNaN(version)) {
        version = __execQueryReturnOneArrayRow(db, sql).pop();
    }
    else {
        const cursorRef = __execQueryAndReturnStatement(`${sql}=${version}`, db);
        sqlite3_finalize(cursorRef);
    }
    return version;
}
function __execQueryReturnOneArrayRow(db, query) {
    const cursorRef = __execQueryAndReturnStatement(query, db);
    const result = __processCursor(cursorRef, 1);
    return result.shift();
}
export * from "./sqlite-access.common";
//# sourceMappingURL=sqlite-access.ios.js.map