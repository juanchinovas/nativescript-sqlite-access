"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("tns-core-modules/file-system");
//Super private variables
var _db;
var _dataReturnedType;
/**
 * This class allow you to connect to sqlite database on Android|iOS
 */
var SqliteAccess = /** @class */ (function () {
    /**
     * Default constructor
     * @param db interop.Reference<any>
     * @param returnType ReturnType
     */
    function SqliteAccess(db, returnType) {
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
    SqliteAccess.prototype.insert = function (table, values) {
        this.execSQL("INSERT INTO " + table + " (" + Object.keys(values).join(",") + ") VALUES(" + __mapToAddOrUpdateValues(values, true) + ")");
        var value = sqlite3_last_insert_rowid(_db.value);
        return Number(value);
    };
    /**
     * Replace a row in the table with the values and
     * return the number of rows affected
     *
     * @param table
     * @param values
     *
     * @returns number
     */
    SqliteAccess.prototype.replace = function (table, values) {
        this.execSQL("REPLACE INTO " + table + " (" + Object.keys(values).join(",") + ") VALUES(" + __mapToAddOrUpdateValues(values, true) + ")");
        var value = sqlite3_changes(_db.value);
        return Number(value);
    };
    /**
     * Update a row in the table with the values and the filters.
     * return the number of rows affected
     *
     * @param table
     * @param values
     * @param whereClause
     * @param whereArs
     *
     * @returns number
     */
    SqliteAccess.prototype.update = function (table, values, whereClause, whereArs) {
        whereClause = whereClause && "WHERE " + whereClause.replace(/\?/g, __replaceQuestionMarkForParams(whereArs)) || "";
        this.execSQL("UPDATE " + table + " SET " + __mapToAddOrUpdateValues(values, false) + " " + whereClause);
        var value = sqlite3_changes(_db.value);
        return Number(value);
    };
    /**
     * Delete a row from the table with the filter.
     * return the number of rows affected
     *
     * @param table
     * @param whereClause?
     * @param whereArgs?
     *
     * @returns number
     */
    SqliteAccess.prototype.delete = function (table, whereClause, whereArgs) {
        whereClause = whereClause && "WHERE " + whereClause.replace(/\?/g, __replaceQuestionMarkForParams(whereArgs)) || "";
        this.execSQL("DELETE FROM " + table + " " + whereClause);
        var value = sqlite3_changes(_db.value);
        return Number(value);
    };
    /**
     * Execute a query selector
     * @param sql
     * @param params
     *
     * @returns Promise<Array<any>>
     */
    SqliteAccess.prototype.select = function (sql, params) {
        sql = sql.replace(/\?/g, __replaceQuestionMarkForParams(params));
        return new Promise(function (resolve, error) {
            try {
                var cursor = __execQueryAndReturnStatement(sql, _db);
                var __processCursor = __prepareToProcessCursor(cursor);
                var result = __processCursor(_dataReturnedType);
                resolve(result);
            }
            catch (ex) {
                error(ex);
            }
        });
    };
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
    SqliteAccess.prototype.query = function (table, columns, selection, selectionArgs, groupBy, orderBy, limit) {
        selection = selection && "WHERE " + selection.replace(/\?/g, __replaceQuestionMarkForParams(selectionArgs)) || "";
        groupBy = groupBy && "GROUP BY " + groupBy || "";
        orderBy = orderBy && "ORDER BY " + orderBy || "";
        limit = limit && "LIMIT " + limit || "";
        var _columns = columns && columns.join(',') || table + ".*";
        var query = "SELECT " + _columns + " FROM " + table + " " + selection + " " + groupBy + " " + orderBy + " " + limit;
        return new Promise(function (resolve, error) {
            try {
                var cursor = __execQueryAndReturnStatement(query, _db);
                var __processCursor = __prepareToProcessCursor(cursor);
                var result = __processCursor(_dataReturnedType);
                resolve(result);
            }
            catch (ex) {
                error("ErrCode:" + ex);
            }
        });
    };
    /**
     * Execute a SQL script and do not return anything
     * @param sql
     */
    SqliteAccess.prototype.execSQL = function (sql) {
        var cursorRef;
        cursorRef = __execQueryAndReturnStatement(sql, _db);
        sqlite3_finalize(cursorRef.value);
    };
    /**
     * Open a transaction
     */
    SqliteAccess.prototype.beginTransact = function () {
        this.execSQL("BEGIN TRANSACTION");
    };
    /**
     * Commit the transaction
     */
    SqliteAccess.prototype.commit = function () {
        this.execSQL("COMMIT TRANSACTION");
    };
    /**
     * Rollback a transaction
     */
    SqliteAccess.prototype.rollback = function () {
        this.execSQL("ROLLBACK TRANSACTION");
    };
    /**
     * Close the database connection
     */
    SqliteAccess.prototype.close = function () {
        if (_db === null) { //already closed
            return;
        }
        sqlite3_close(_db.value);
        _db = null;
    };
    return SqliteAccess;
}());
/** private function
 * Execute a sql script and return the sqlite3 statement object
 * @param sql
 * @param dbPointer
 *
 * @returns sqlite3 statement object stepped
 *
 * @throws
 * if sqlite3_prepare_v2 returns !== 0
 * if sqlite3_step !== 101
 */
function __execQueryAndReturnStatement(sql, dbPointer) {
    var cursorRef = new interop.Reference();
    var resultCode = sqlite3_prepare_v2(dbPointer.value, sql, -1, cursorRef, null);
    var applyStatementCode = sqlite3_step(cursorRef.value);
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
 * @param whereParams
 * @returns ()=>string|number
 */
function __replaceQuestionMarkForParams(whereParams) {
    var counter = 0;
    return function () {
        var arg = whereParams[counter++];
        return !!parseFloat(arg) ? Number(arg) : "'" + arg + "'";
    };
}
/** private function
 * Curring funcion to loop android.database.Cursor
 * @param cursor android.database.Cursor
 *
 * @returns (returnType: ReturnType) => Array<any>;
 */
function __prepareToProcessCursor(cursorRef) {
    return function (returnType) {
        var result = [];
        do {
            result.push(__getRowValues(cursorRef, returnType));
        } while (sqlite3_step(cursorRef) !== 101 /*SQLITE_DONE*/);
        sqlite3_finalize(cursorRef);
        return result;
    };
}
/** private function
 * Process the sqlite cursor and return a
 * js object with column/value or an array row
 *
 * @param cursor
 * @param returnType
 * @returns JS  array or object like {[column:string]: any}
 */
function __getRowValues(cursor, returnType) {
    var rowValue = {};
    if (returnType === 1 /* AS_ARRAY */) {
        rowValue = [];
    }
    var primitiveType = null;
    var columnName = '';
    var value = null;
    var columnCount = sqlite3_column_count(cursor);
    for (var i = 0; i < columnCount; i++) {
        primitiveType = sqlite3_column_type(cursor, i);
        columnName = sqlite3_column_name(cursor, i);
        columnName = NSString.stringWithUTF8String(columnName).toString();
        switch (primitiveType) {
            case 1 /*FIELD_TYPE_INTEGER*/:
                value = sqlite3_column_int64(cursor, i);
                break;
            case 2 /*FIELD_TYPE_FLOAT*/:
                value = sqlite3_column_double(cursor, i);
                break;
            case 3 /*FIELD_TYPE_STRING*/:
                value = sqlite3_column_text(cursor, i);
                value = NSString.stringWithUTF8String(value).toString();
                break;
            case 4 /*FIELD_TYPE_BLOB*/:
                //uncomment the code below if you wanna use it and change continue for break
                /*NSData.dataWithBytesLength(sqlite3_column_blob(cursor, i), sqlite3_column_bytes(cursor, i)/*length* /);
                value = sqlite3_column_blob(cursor, i);*/
                continue;
            case 5 /*FIELD_TYPE_NULL*/:
                value = null;
                break;
        }
        // If result wanted as array of array
        if (Array.isArray(rowValue) && returnType === 1 /* AS_ARRAY */) {
            rowValue.push(value);
            continue;
        }
        rowValue[columnName] = value;
    }
    return rowValue;
}
/** private function
 * open or create a read-write database, permanently or in memory
 * @param dbName database name
 * @param mode openness mode
 *
 * @returns interop.Reference<any> sqlite3*
 *
 * @throws
 * if sqlite3_open_v2 returned code !== 0
 */
function __openCreateDataBase(dbName, mode) {
    var dbInstance = new interop.Reference();
    var resultCode = 0;
    if (dbName === ":memory:") {
        resultCode = sqlite3_open_v2(dbName, dbInstance, mode | 296 /*SQLITE_OPEN_MEMORY*/, null);
    }
    else {
        dbName = fs.knownFolders.documents().path + "/" + dbName;
        mode = mode | 4 /*SQLITE_OPEN_CREATE*/;
        resultCode = sqlite3_open_v2(dbName, dbInstance, mode, null);
    }
    if (resultCode !== 0 /*SQLITE_OK*/) {
        throw "Could not open database. sqlite error code " + resultCode;
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
function __mapToAddOrUpdateValues(values, inserting) {
    if (inserting === void 0) { inserting = true; }
    var contentValues = [];
    for (var key in values) {
        if (values.hasOwnProperty(key)) {
            var value = values[key];
            value = !!parseFloat(value) ? Number(value) : "'" + value + "'";
            contentValues.push(inserting && value || key + "=" + value);
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
function DbBuilder(dbName, options) {
    if (!dbName)
        throw "Must specify a db name";
    options = options || ({
        version: 1
    });
    // Ensure version be 1 or greater and returnType AS_OBJECT
    options.version = options.version || 1;
    options.returnType = options.returnType || 0 /* AS_OBJECT */;
    var db = __openCreateDataBase(dbName, 2 /*SQLITE_OPEN_READWRITE*/);
    var currVersion = __dbVersion(db);
    if (options.version > currVersion) {
        __dbVersion(db, options.version);
        var tableCreateScripts = options.createTableScriptsFn && options.createTableScriptsFn();
        var tableDroptScripts = options.dropTableScriptsFn && options.dropTableScriptsFn();
        try {
            // Dropping all tables
            if (tableDroptScripts) {
                for (var script in tableDroptScripts) {
                    var cursorRef = __execQueryAndReturnStatement(tableDroptScripts[script], db);
                    sqlite3_finalize(cursorRef);
                }
            }
            // Creating all tables
            if (tableCreateScripts) {
                for (var script in tableCreateScripts) {
                    var cursorRef = __execQueryAndReturnStatement(tableCreateScripts[script], db);
                    sqlite3_finalize(cursorRef);
                }
            }
        }
        catch (error) {
            sqlite3_close(db);
            throw error;
        }
    }
    else if (options.version < currVersion) {
        sqlite3_close(db);
        throw "It is not possible to set the version " + options.version + " to database, because is lower then current version, Db current version is " + currVersion;
    }
    return new SqliteAccess(db, options.returnType);
}
exports.DbBuilder = DbBuilder;
/** private function
 * get or set the database user_version
 * @param db sqlite3*
 * @param version
 *
 * @returns number|undefined
 */
function __dbVersion(db, version) {
    var sql = "PRAGMA user_version";
    if (isNaN(version)) {
        version = __execQueryReturnOneArrayRow(db, sql).pop();
    }
    else {
        var cursorRef = __execQueryAndReturnStatement(sql + "=" + version, db);
        sqlite3_finalize(cursorRef);
    }
    return version;
}
/** private function
 * execute a sql query and return the first row
 * @param db sqlite3*
 * @param query
 *
 * @return Array<any>
 */
function __execQueryReturnOneArrayRow(db, query) {
    var cursorRef = __execQueryAndReturnStatement(query, db);
    var __processCursor = __prepareToProcessCursor(cursorRef);
    var result = __processCursor(1 /* AS_ARRAY */);
    return result.shift();
}
/**
 * Export ReturnType and DbCreationOptions
 */
__export(require("./common/Common"));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3FsaXRlLWFjY2Vzcy5pb3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcWxpdGUtYWNjZXNzLmlvcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUNBLGlEQUFrRDtBQUdsRCx5QkFBeUI7QUFDekIsSUFBSSxHQUEyQixDQUFDO0FBQ2hDLElBQUksaUJBQTZCLENBQUM7QUFFbEM7O0dBRUc7QUFFSDtJQUVJOzs7O09BSUc7SUFDSCxzQkFBWSxFQUEwQixFQUNsQyxVQUFzQjtRQUN0QixHQUFHLEdBQUcsRUFBRSxDQUFDO1FBQ1QsaUJBQWlCLEdBQUcsVUFBVSxDQUFDO0lBQ25DLENBQUM7SUFFRDs7Ozs7Ozs7T0FRRztJQUNILDZCQUFNLEdBQU4sVUFBTyxLQUFhLEVBQUUsTUFBK0I7UUFDakQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBZSxLQUFLLFVBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLGlCQUFZLHdCQUF3QixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBRyxDQUFDLENBQUM7UUFDMUgsSUFBSSxLQUFLLEdBQUcseUJBQXlCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pELE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7Ozs7Ozs7T0FRRztJQUNILDhCQUFPLEdBQVAsVUFBUSxLQUFhLEVBQUUsTUFBK0I7UUFDbEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBZ0IsS0FBSyxVQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxpQkFBWSx3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQUcsQ0FBQyxDQUFDO1FBQzNILElBQUksS0FBSyxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkMsT0FBTyxNQUFN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QUFPLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUMxQixDQUFDO0FBRUQ7O0dBRUc7QUFDSCxxQ0FBZ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJRGF0YWJhc2UgfSBmcm9tICcuL2NvbW1vbi9JRGF0YWJhc2UnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvZmlsZS1zeXN0ZW1cIlxuaW1wb3J0IHsgRGJDcmVhdGlvbk9wdGlvbnMsIFJldHVyblR5cGUgfSBmcm9tICcuL2NvbW1vbi9Db21tb24nO1xuXG4vL1N1cGVyIHByaXZhdGUgdmFyaWFibGVzXG5sZXQgX2RiOiBpbnRlcm9wLlJlZmVyZW5jZTxhbnk+O1xubGV0IF9kYXRhUmV0dXJuZWRUeXBlOiBSZXR1cm5UeXBlO1xuXG4vKipcbiAqIFRoaXMgY2xhc3MgYWxsb3cgeW91IHRvIGNvbm5lY3QgdG8gc3FsaXRlIGRhdGFiYXNlIG9uIEFuZHJvaWR8aU9TXG4gKi9cblxuY2xhc3MgU3FsaXRlQWNjZXNzIGltcGxlbWVudHMgSURhdGFiYXNlIHtcblxuICAgIC8qKlxuICAgICAqIERlZmF1bHQgY29uc3RydWN0b3JcbiAgICAgKiBAcGFyYW0gZGIgaW50ZXJvcC5SZWZlcmVuY2U8YW55PlxuICAgICAqIEBwYXJhbSByZXR1cm5UeXBlIFJldHVyblR5cGVcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihkYjogaW50ZXJvcC5SZWZlcmVuY2U8YW55PiwgXG4gICAgICAgIHJldHVyblR5cGU6IFJldHVyblR5cGUpIHtcbiAgICAgICAgX2RiID0gZGI7XG4gICAgICAgIF9kYXRhUmV0dXJuZWRUeXBlID0gcmV0dXJuVHlwZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnNlcnQgYSByb3cgaW50byB0YWJsZSB3aXRoIHRoZSB2YWx1ZXMgYW5kIHJldHVybiB0aGUgbGFzdFxuICAgICAqIGluc2VydGVkIGlkIGluIHRoZSB0YWJsZVxuICAgICAqIFxuICAgICAqIEBwYXJhbSB0YWJsZSBcbiAgICAgKiBAcGFyYW0gdmFsdWVzIFxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIG51bWJlclxuICAgICAqL1xuICAgIGluc2VydCh0YWJsZTogc3RyaW5nLCB2YWx1ZXM6IHsgW2tleTogc3RyaW5nXTogYW55OyB9KTogbnVtYmVyIHtcbiAgICAgICAgdGhpcy5leGVjU1FMKGBJTlNFUlQgSU5UTyAke3RhYmxlfSAoJHtPYmplY3Qua2V5cyh2YWx1ZXMpLmpvaW4oXCIsXCIpfSkgVkFMVUVTKCR7X19tYXBUb0FkZE9yVXBkYXRlVmFsdWVzKHZhbHVlcywgdHJ1ZSl9KWApO1xuICAgICAgICBsZXQgdmFsdWUgPSBzcWxpdGUzX2xhc3RfaW5zZXJ0X3Jvd2lkKF9kYi52YWx1ZSk7XG4gICAgICAgIHJldHVybiBOdW1iZXIodmFsdWUpO1xuICAgIH0gICAgXG4gICAgXG4gICAgLyoqXG4gICAgICogUmVwbGFjZSBhIHJvdyBpbiB0aGUgdGFibGUgd2l0aCB0aGUgdmFsdWVzIGFuZCBcbiAgICAgKiByZXR1cm4gdGhlIG51bWJlciBvZiByb3dzIGFmZmVjdGVkXG4gICAgICogXG4gICAgICogQHBhcmFtIHRhYmxlIFxuICAgICAqIEBwYXJhbSB2YWx1ZXNcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyBudW1iZXIgXG4gICAgICovXG4gICAgcmVwbGFjZSh0YWJsZTogc3RyaW5nLCB2YWx1ZXM6IHsgW2tleTogc3RyaW5nXTogYW55OyB9KTogbnVtYmVyIHtcbiAgICAgICAgdGhpcy5leGVjU1FMKGBSRVBMQUNFIElOVE8gJHt0YWJsZX0gKCR7T2JqZWN0LmtleXModmFsdWVzKS5qb2luKFwiLFwiKX0pIFZBTFVFUygke19fbWFwVG9BZGRPclVwZGF0ZVZhbHVlcyh2YWx1ZXMsIHRydWUpfSlgKTtcbiAgICAgICAgbGV0IHZhbHVlID0gc3FsaXRlM19jaGFuZ2VzKF9kYi52YWx1ZSk7XG4gICAgICAgIHJldHVybiBOdW1iZXIodmFsdWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBhIHJvdyBpbiB0aGUgdGFibGUgd2l0aCB0aGUgdmFsdWVzIGFuZCB0aGUgZmlsdGVycy4gXG4gICAgICogcmV0dXJuIHRoZSBudW1iZXIgb2Ygcm93cyBhZmZlY3RlZFxuICAgICAqIFxuICAgICAqIEBwYXJhbSB0YWJsZSBcbiAgICAgKiBAcGFyYW0gdmFsdWVzXG4gICAgICogQHBhcmFtIHdoZXJlQ2xhdXNlIFxuICAgICAqIEBwYXJhbSB3aGVyZUFycyBcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyBudW1iZXIgXG4gICAgICovXG4gICAgdXBkYXRlKHRhYmxlOiBzdHJpbmcsIHZhbHVlczogeyBba2V5OiBzdHJpbmddOiBhbnk7IH0sIHdoZXJlQ2xhdXNlOiBzdHJpbmcsIHdoZXJlQXJzOiBhbnlbXSk6IG51bWJlciB7XG4gICAgICAgIHdoZXJlQ2xhdXNlID0gd2hlcmVDbGF1c2UgJiYgXCJXSEVSRSBcIiArIHdoZXJlQ2xhdXNlLnJlcGxhY2UoL1xcPy9nLCA8YW55Pl9fcmVwbGFjZVF1ZXN0aW9uTWFya0ZvclBhcmFtcyh3aGVyZUFycykpIHx8IFwiXCI7XG4gICAgICAgIHRoaXMuZXhlY1NRTChgVVBEQVRFICR7dGFibGV9IFNFVCAke19fbWFwVG9BZGRPclVwZGF0ZVZhbHVlcyh2YWx1ZXMsIGZhbHNlKX0gJHt3aGVyZUNsYXVzZX1gKTtcbiAgICAgICAgbGV0IHZhbHVlID0gc3FsaXRlM19jaGFuZ2VzKF9kYi52YWx1ZSk7XG4gICAgICAgIHJldHVybiBOdW1iZXIodmFsdWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlbGV0ZSBhIHJvdyBmcm9tIHRoZSB0YWJsZSB3aXRoIHRoZSBmaWx0ZXIuXG4gICAgICogcmV0dXJuIHRoZSBudW1iZXIgb2Ygcm93cyBhZmZlY3RlZFxuICAgICAqIFxuICAgICAqIEBwYXJhbSB0YWJsZSBcbiAgICAgKiBAcGFyYW0gd2hlcmVDbGF1c2U/IFxuICAgICAqIEBwYXJhbSB3aGVyZUFyZ3M/XG4gICAgICogXG4gICAgICogQHJldHVybnMgbnVtYmVyXG4gICAgICovXG4gICAgZGVsZXRlKHRhYmxlOiBzdHJpbmcsIHdoZXJlQ2xhdXNlPzogc3RyaW5nLCB3aGVyZUFyZ3M/OiBhbnlbXSk6IG51bWJlciB7XG4gICAgICAgIHdoZXJlQ2xhdXNlID0gd2hlcmVDbGF1c2UgJiYgXCJXSEVSRSBcIiArIHdoZXJlQ2xhdXNlLnJlcGxhY2UoL1xcPy9nLCA8YW55Pl9fcmVwbGFjZVF1ZXN0aW9uTWFya0ZvclBhcmFtcyh3aGVyZUFyZ3MpKSB8fCBcIlwiO1xuICAgICAgICB0aGlzLmV4ZWNTUUwoYERFTEVURSBGUk9NICR7dGFibGV9ICR7d2hlcmVDbGF1c2V9YCk7XG4gICAgICAgIGxldCB2YWx1ZSA9IHNxbGl0ZTNfY2hhbmdlcyhfZGIudmFsdWUpO1xuICAgICAgICByZXR1cm4gTnVtYmVyKHZhbHVlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlIGEgcXVlcnkgc2VsZWN0b3JcbiAgICAgKiBAcGFyYW0gc3FsIFxuICAgICAqIEBwYXJhbSBwYXJhbXMgXG4gICAgICogXG4gICAgICogQHJldHVybnMgUHJvbWlzZTxBcnJheTxhbnk+PlxuICAgICAqL1xuICAgIHNlbGVjdChzcWw6IHN0cmluZywgcGFyYW1zPzogYW55W10pOiBQcm9taXNlPEFycmF5PGFueT4+IHtcbiAgICAgICAgc3FsID0gc3FsLnJlcGxhY2UoL1xcPy9nLCA8YW55Pl9fcmVwbGFjZVF1ZXN0aW9uTWFya0ZvclBhcmFtcyhwYXJhbXMpKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIGVycm9yKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCBjdXJzb3IgPSAgX19leGVjUXVlcnlBbmRSZXR1cm5TdGF0ZW1lbnQoc3FsLCBfZGIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IF9fcHJvY2Vzc0N1cnNvciA9IF9fcHJlcGFyZVRvUHJvY2Vzc0N1cnNvcihjdXJzb3IpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fcHJvY2Vzc0N1cnNvcihfZGF0YVJldHVybmVkVHlwZSk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgfSBjYXRjaChleCkge1xuICAgICAgICAgICAgICAgIGVycm9yKGV4KVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlIGEgcXVlcnkgc2VsZWN0b3JcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gdGFibGUgXG4gICAgICogQHBhcmFtIGNvbHVtbnMgXG4gICAgICogQHBhcmFtIHNlbGVjdGlvbiBcbiAgICAgKiBAcGFyYW0gc2VsZWN0aW9uQXJncyBcbiAgICAgKiBAcGFyYW0gZ3JvdXBCeSBcbiAgICAgKiBAcGFyYW0gb3JkZXJCeSBcbiAgICAgKiBAcGFyYW0gbGltaXQgXG4gICAgICogXG4gICAgICogQHJldHVybnMgUHJvbWlzZTxBcnJheTxhbnk+PlxuICAgICAqL1xuICAgIHF1ZXJ5KHRhYmxlOiBzdHJpbmcsIGNvbHVtbnM/OiBzdHJpbmdbXSwgc2VsZWN0aW9uPzogc3RyaW5nLCBzZWxlY3Rpb25BcmdzPzogYW55W10sIGdyb3VwQnk/OiBzdHJpbmcsIG9yZGVyQnk/OiBzdHJpbmcsIGxpbWl0Pzogc3RyaW5nKTogUHJvbWlzZTxBcnJheTxhbnk+PiB7XG4gICAgICAgIHNlbGVjdGlvbiA9IHNlbGVjdGlvbiAmJiBcIldIRVJFIFwiICsgc2VsZWN0aW9uLnJlcGxhY2UoL1xcPy9nLCA8YW55Pl9fcmVwbGFjZVF1ZXN0aW9uTWFya0ZvclBhcmFtcyhzZWxlY3Rpb25BcmdzKSkgfHwgXCJcIjtcbiAgICAgICAgZ3JvdXBCeSA9IGdyb3VwQnkgJiYgXCJHUk9VUCBCWSBcIiArIGdyb3VwQnkgfHwgXCJcIjsgXG4gICAgICAgIG9yZGVyQnkgPSBvcmRlckJ5ICYmIFwiT1JERVIgQlkgXCIgKyBvcmRlckJ5IHx8IFwiXCI7XG4gICAgICAgIGxpbWl0ID0gbGltaXQgJiYgXCJMSU1JVCBcIiArIGxpbWl0IHx8IFwiXCI7XG4gICAgICAgIGNvbnN0IF9jb2x1bW5zID0gY29sdW1ucyAmJiBjb2x1bW5zLmpvaW4oJywnKSB8fCBgJHt0YWJsZX0uKmA7XG4gICAgICAgIGxldCBxdWVyeSA9IGBTRUxFQ1QgJHtfY29sdW1uc30gRlJPTSAke3RhYmxlfSAke3NlbGVjdGlvbn0gJHtncm91cEJ5fSAke29yZGVyQnl9ICR7bGltaXR9YDtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIGVycm9yKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCBjdXJzb3IgPSAgX19leGVjUXVlcnlBbmRSZXR1cm5TdGF0ZW1lbnQocXVlcnksIF9kYik7XG4gICAgICAgICAgICAgICAgY29uc3QgX19wcm9jZXNzQ3Vyc29yID0gX19wcmVwYXJlVG9Qcm9jZXNzQ3Vyc29yKGN1cnNvcik7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX19wcm9jZXNzQ3Vyc29yKF9kYXRhUmV0dXJuZWRUeXBlKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICB9IGNhdGNoKGV4KSB7XG4gICAgICAgICAgICAgICAgZXJyb3IoYEVyckNvZGU6JHtleH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGUgYSBTUUwgc2NyaXB0IGFuZCBkbyBub3QgcmV0dXJuIGFueXRoaW5nXG4gICAgICogQHBhcmFtIHNxbCBcbiAgICAgKi9cbiAgICBleGVjU1FMKHNxbDogc3RyaW5nKSB7XG4gICAgICAgIGxldCBjdXJzb3JSZWY6IGludGVyb3AuUmVmZXJlbmNlPGFueT47XG4gICAgICAgIGN1cnNvclJlZiA9IF9fZXhlY1F1ZXJ5QW5kUmV0dXJuU3RhdGVtZW50KHNxbCwgX2RiKTtcbiAgICAgICAgc3FsaXRlM19maW5hbGl6ZShjdXJzb3JSZWYudmFsdWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9wZW4gYSB0cmFuc2FjdGlvblxuICAgICAqL1xuICAgIGJlZ2luVHJhbnNhY3QoKSB7XG4gICAgICAgIHRoaXMuZXhlY1NRTChcIkJFR0lOIFRSQU5TQUNUSU9OXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbW1pdCB0aGUgdHJhbnNhY3Rpb25cbiAgICAgKi9cbiAgICBjb21taXQoKSB7XG4gICAgICAgIHRoaXMuZXhlY1NRTChcIkNPTU1JVCBUUkFOU0FDVElPTlwiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSb2xsYmFjayBhIHRyYW5zYWN0aW9uXG4gICAgICovXG4gICAgcm9sbGJhY2soKSB7XG4gICAgICAgIHRoaXMuZXhlY1NRTChcIlJPTExCQUNLIFRSQU5TQUNUSU9OXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsb3NlIHRoZSBkYXRhYmFzZSBjb25uZWN0aW9uXG4gICAgICovXG4gICAgY2xvc2UoKTogdm9pZCB7XG4gICAgICAgIGlmIChfZGIgPT09IG51bGwpIHsgLy9hbHJlYWR5IGNsb3NlZFxuICAgICAgICAgICAgcmV0dXJuOyBcbiAgICAgICAgfVxuXG4gICAgICAgIHNxbGl0ZTNfY2xvc2UoX2RiLnZhbHVlKTtcbiAgICAgICAgX2RiID0gbnVsbDtcbiAgICB9XG59XG5cbi8qKiBwcml2YXRlIGZ1bmN0aW9uXG4gKiBFeGVjdXRlIGEgc3FsIHNjcmlwdCBhbmQgcmV0dXJuIHRoZSBzcWxpdGUzIHN0YXRlbWVudCBvYmplY3RcbiAqIEBwYXJhbSBzcWwgXG4gKiBAcGFyYW0gZGJQb2ludGVyIFxuICogXG4gKiBAcmV0dXJucyBzcWxpdGUzIHN0YXRlbWVudCBvYmplY3Qgc3RlcHBlZFxuICogXG4gKiBAdGhyb3dzXG4gKiBpZiBzcWxpdGUzX3ByZXBhcmVfdjIgcmV0dXJucyAhPT0gMFxuICogaWYgc3FsaXRlM19zdGVwICE9PSAxMDFcbiAqL1xuZnVuY3Rpb24gX19leGVjUXVlcnlBbmRSZXR1cm5TdGF0ZW1lbnQoc3FsOiBzdHJpbmcsIGRiUG9pbnRlcjogaW50ZXJvcC5SZWZlcmVuY2U8YW55Pik6IGFueSB7XG4gICAgbGV0IGN1cnNvclJlZiA9IG5ldyBpbnRlcm9wLlJlZmVyZW5jZTxhbnk+KCk7XG4gICAgbGV0IHJlc3VsdENvZGUgPSBzcWxpdGUzX3ByZXBhcmVfdjIoZGJQb2ludGVyLnZhbHVlLCBzcWwsIC0xLCBjdXJzb3JSZWYsIG51bGwpO1xuICAgIGxldCBhcHBseVN0YXRlbWVudENvZGUgID0gc3FsaXRlM19zdGVwKGN1cnNvclJlZi52YWx1ZSk7XG4gICAgaWYgKHJlc3VsdENvZGUgIT09IDAgLypTUUxJVEVfT0sqLyB8fCAoYXBwbHlTdGF0ZW1lbnRDb2RlICE9PSAxMDEvKlNRTElURV9ET05FKi8gJiYgYXBwbHlTdGF0ZW1lbnRDb2RlICE9PSAxMDAvKlNRTElURV9ST1cqLykpIHtcbiAgICAgICAgc3FsaXRlM19maW5hbGl6ZShjdXJzb3JSZWYudmFsdWUpO1xuICAgICAgICBjdXJzb3JSZWYudmFsdWUgPSBudWxsXG4gICAgICAgIGN1cnNvclJlZiA9IG51bGw7XG5cbiAgICAgICAgdGhyb3cgTlNTdHJpbmcuc3RyaW5nV2l0aFVURjhTdHJpbmcoc3FsaXRlM19lcnJtc2coZGJQb2ludGVyLnZhbHVlKSkudG9TdHJpbmcoKTtcbiAgICB9XG4gICAgcmV0dXJuIGN1cnNvclJlZi52YWx1ZTtcbn1cblxuLyoqIHByaXZhdGUgZnVuY3Rpb25cbiAqIFJldHVybiBhIGZ1bmN0aW9uIHRvIHJlcGxhY2UgdGhlIHF1ZXN0aW9uIG1hcmsgaW4gdGhlIFxuICogcXVlcnkgaXRoIHRoZSB2YWx1ZXNcbiAqIFxuICogQHBhcmFtIHdoZXJlUGFyYW1zIFxuICogQHJldHVybnMgKCk9PnN0cmluZ3xudW1iZXJcbiAqL1xuZnVuY3Rpb24gX19yZXBsYWNlUXVlc3Rpb25NYXJrRm9yUGFyYW1zKHdoZXJlUGFyYW1zOiBBcnJheTxhbnk+KTogRnVuY3Rpb24ge1xuICAgIGxldCBjb3VudGVyID0gMDtcbiAgICByZXR1cm4gKCk9PiB7XG4gICAgICAgIGxldCBhcmcgPSB3aGVyZVBhcmFtc1tjb3VudGVyKytdO1xuICAgICAgICByZXR1cm4gISFwYXJzZUZsb2F0KGFyZyk/IE51bWJlcihhcmcpOiBgJyR7YXJnfSdgO1xuICAgIH07XG59XG5cbi8qKiBwcml2YXRlIGZ1bmN0aW9uXG4gKiBDdXJyaW5nIGZ1bmNpb24gdG8gbG9vcCBhbmRyb2lkLmRhdGFiYXNlLkN1cnNvclxuICogQHBhcmFtIGN1cnNvciBhbmRyb2lkLmRhdGFiYXNlLkN1cnNvclxuICogXG4gKiBAcmV0dXJucyAocmV0dXJuVHlwZTogUmV0dXJuVHlwZSkgPT4gQXJyYXk8YW55PjtcbiAqL1xuZnVuY3Rpb24gX19wcmVwYXJlVG9Qcm9jZXNzQ3Vyc29yKGN1cnNvclJlZjogYW55KTogKHJldHVyblR5cGU6IFJldHVyblR5cGUpPT5BcnJheTxhbnk+IHtcbiAgICByZXR1cm4gKHJldHVyblR5cGU6IFJldHVyblR5cGUpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gW107XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKCBfX2dldFJvd1ZhbHVlcyhjdXJzb3JSZWYsIHJldHVyblR5cGUpICk7XG4gICAgICAgIH0gd2hpbGUgKHNxbGl0ZTNfc3RlcChjdXJzb3JSZWYpICE9PSAxMDEvKlNRTElURV9ET05FKi8pO1xuICAgICAgICAgICAgXG4gICAgICAgIHNxbGl0ZTNfZmluYWxpemUoY3Vyc29yUmVmKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG59XG5cbi8qKiBwcml2YXRlIGZ1bmN0aW9uXG4gKiBQcm9jZXNzIHRoZSBzcWxpdGUgY3Vyc29yIGFuZCByZXR1cm4gYSBcbiAqIGpzIG9iamVjdCB3aXRoIGNvbHVtbi92YWx1ZSBvciBhbiBhcnJheSByb3dcbiAqIFxuICogQHBhcmFtIGN1cnNvciBcbiAqIEBwYXJhbSByZXR1cm5UeXBlIFxuICogQHJldHVybnMgSlMgIGFycmF5IG9yIG9iamVjdCBsaWtlIHtbY29sdW1uOnN0cmluZ106IGFueX1cbiAqL1xuZnVuY3Rpb24gX19nZXRSb3dWYWx1ZXMoY3Vyc29yOiBhbnksIHJldHVyblR5cGU6IFJldHVyblR5cGUpOiBhbnkge1xuXG4gICAgbGV0IHJvd1ZhbHVlOiBhbnkgPSB7fTtcbiAgICBpZiAocmV0dXJuVHlwZSA9PT0gUmV0dXJuVHlwZS5BU19BUlJBWSkge1xuICAgICAgICByb3dWYWx1ZSA9IFtdO1xuICAgIH1cblxuICAgIGxldCBwcmltaXRpdmVUeXBlID0gbnVsbDtcbiAgICBsZXQgY29sdW1uTmFtZSA9ICcnO1xuICAgIGxldCB2YWx1ZSA9IG51bGw7XG4gICAgbGV0IGNvbHVtbkNvdW50OiBudW1iZXIgPSBzcWxpdGUzX2NvbHVtbl9jb3VudChjdXJzb3IpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29sdW1uQ291bnQ7IGkrKykge1xuICAgICAgICBwcmltaXRpdmVUeXBlID0gc3FsaXRlM19jb2x1bW5fdHlwZShjdXJzb3IsIGkpO1xuICAgICAgICBjb2x1bW5OYW1lID0gc3FsaXRlM19jb2x1bW5fbmFtZShjdXJzb3IsIGkpO1xuICAgICAgICBjb2x1bW5OYW1lID0gTlNTdHJpbmcuc3RyaW5nV2l0aFVURjhTdHJpbmcoY29sdW1uTmFtZSkudG9TdHJpbmcoKTtcbiAgICAgICAgc3dpdGNoIChwcmltaXRpdmVUeXBlKSB7XG4gICAgICAgICAgICBjYXNlIDEvKkZJRUxEX1RZUEVfSU5URUdFUiovOiBcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHNxbGl0ZTNfY29sdW1uX2ludDY0KGN1cnNvciwgaSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDIvKkZJRUxEX1RZUEVfRkxPQVQqLzogXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzcWxpdGUzX2NvbHVtbl9kb3VibGUoY3Vyc29yLCBpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMy8qRklFTERfVFlQRV9TVFJJTkcqLzogXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzcWxpdGUzX2NvbHVtbl90ZXh0KGN1cnNvciwgaSk7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBOU1N0cmluZy5zdHJpbmdXaXRoVVRGOFN0cmluZyh2YWx1ZSkudG9TdHJpbmcoKTsgICAgXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDQvKkZJRUxEX1RZUEVfQkxPQiovOlxuICAgICAgICAgICAgICAgIC8vdW5jb21tZW50IHRoZSBjb2RlIGJlbG93IGlmIHlvdSB3YW5uYSB1c2UgaXQgYW5kIGNoYW5nZSBjb250aW51ZSBmb3IgYnJlYWtcbiAgICAgICAgICAgICAgICAvKk5TRGF0YS5kYXRhV2l0aEJ5dGVzTGVuZ3RoKHNxbGl0ZTNfY29sdW1uX2Jsb2IoY3Vyc29yLCBpKSwgc3FsaXRlM19jb2x1bW5fYnl0ZXMoY3Vyc29yLCBpKS8qbGVuZ3RoKiAvKTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHNxbGl0ZTNfY29sdW1uX2Jsb2IoY3Vyc29yLCBpKTsqL1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgY2FzZSA1LypGSUVMRF9UWVBFX05VTEwqLzpcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgLy8gSWYgcmVzdWx0IHdhbnRlZCBhcyBhcnJheSBvZiBhcnJheVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyb3dWYWx1ZSkgJiYgcmV0dXJuVHlwZSA9PT0gUmV0dXJuVHlwZS5BU19BUlJBWSkge1xuICAgICAgICAgICAgcm93VmFsdWUucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJvd1ZhbHVlW2NvbHVtbk5hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIHJldHVybiByb3dWYWx1ZTtcbn1cblxuLyoqIHByaXZhdGUgZnVuY3Rpb25cbiAqIG9wZW4gb3IgY3JlYXRlIGEgcmVhZC13cml0ZSBkYXRhYmFzZSwgcGVybWFuZW50bHkgb3IgaW4gbWVtb3J5XG4gKiBAcGFyYW0gZGJOYW1lIGRhdGFiYXNlIG5hbWVcbiAqIEBwYXJhbSBtb2RlIG9wZW5uZXNzIG1vZGVcbiAqIFxuICogQHJldHVybnMgaW50ZXJvcC5SZWZlcmVuY2U8YW55PiBzcWxpdGUzKlxuICogXG4gKiBAdGhyb3dzXG4gKiBpZiBzcWxpdGUzX29wZW5fdjIgcmV0dXJuZWQgY29kZSAhPT0gMFxuICovXG5mdW5jdGlvbiBfX29wZW5DcmVhdGVEYXRhQmFzZShkYk5hbWU6IHN0cmluZywgbW9kZTogbnVtYmVyKSB7XG4gICAgY29uc3QgZGJJbnN0YW5jZSA9IG5ldyBpbnRlcm9wLlJlZmVyZW5jZTxhbnk+KCk7XG4gICAgbGV0IHJlc3VsdENvZGU6IG51bWJlciA9IDA7XG4gICAgaWYgKGRiTmFtZSA9PT0gXCI6bWVtb3J5OlwiKSB7XG4gICAgICAgIHJlc3VsdENvZGUgPSBzcWxpdGUzX29wZW5fdjIoZGJOYW1lLCBkYkluc3RhbmNlLCBtb2RlIHwgMjk2IC8qU1FMSVRFX09QRU5fTUVNT1JZKi8sIG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGRiTmFtZSA9IGAke2ZzLmtub3duRm9sZGVycy5kb2N1bWVudHMoKS5wYXRofS8ke2RiTmFtZX1gO1xuICAgICAgICBtb2RlID0gIG1vZGUgfCA0IC8qU1FMSVRFX09QRU5fQ1JFQVRFKi87XG4gICAgICAgIFxuICAgICAgICByZXN1bHRDb2RlID0gc3FsaXRlM19vcGVuX3YyKGRiTmFtZSwgZGJJbnN0YW5jZSwgbW9kZSwgbnVsbCk7XG4gICAgfVxuICAgIFxuICAgIGlmIChyZXN1bHRDb2RlICE9PSAwIC8qU1FMSVRFX09LKi8pIHtcbiAgICAgICAgdGhyb3cgYENvdWxkIG5vdCBvcGVuIGRhdGFiYXNlLiBzcWxpdGUgZXJyb3IgY29kZSAke3Jlc3VsdENvZGV9YDtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGRiSW5zdGFuY2U7XG59XG5cbi8qKiBwcml2YXRlIGZ1bmN0aW9uXG4gKiBNYXAgYSBrZXkvdmFsdWUgSlMgb2JqZWN0IHRvIEFycmF5PHN0cmluZz5cbiAqIEBwYXJhbSB2YWx1ZXMgeyBba2V5OiBzdHJpbmddOiBhbnk7IH1cbiAqIEBwYXJhbSBpbnNlcnRpbmcgYm9vbGVhblxuICogXG4gKiBAcmV0dXJucyBzdHJpbmdcbiAqL1xuZnVuY3Rpb24gX19tYXBUb0FkZE9yVXBkYXRlVmFsdWVzKHZhbHVlczogeyBba2V5OiBzdHJpbmddOiBhbnk7IH0sIGluc2VydGluZzogYm9vbGVhbiA9IHRydWUpIHtcbiAgICBsZXQgY29udGVudFZhbHVlcyA9IFtdO1xuICAgIGZvciAoY29uc3Qga2V5IGluIHZhbHVlcykge1xuICAgICAgICBpZiAodmFsdWVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9ICB2YWx1ZXNba2V5XTtcbiAgICAgICAgICAgIHZhbHVlID0gISFwYXJzZUZsb2F0KHZhbHVlKT8gTnVtYmVyKHZhbHVlKTogYCcke3ZhbHVlfSdgXG4gICAgICAgICAgICBjb250ZW50VmFsdWVzLnB1c2goaW5zZXJ0aW5nICYmIHZhbHVlIHx8IGAke2tleX09JHt2YWx1ZX1gKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29udGVudFZhbHVlcy5qb2luKFwiLFwiKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYW4gaW5zdGFuY2Ugb2Ygc3FsaXRlMyosIGV4ZWN1dGUgdGhlIGRyb3BwaW5nIGFuZCBjcmVhdGluZyB0YWJsZXMgc2NyaXB0cyBpZiBleGlzdHNcbiAqIGFuZCBpZiB0aGUgdmVyc2lvbiBudW1iZXIgaXMgZ3JlYXRlciB0aGUgZGF0YWJhc2UgdmVyc2lvblxuICogQHBhcmFtIGRiTmFtZSBTdHJpbmdcbiAqIEBwYXJhbSBvcHRpb25zIERiQ3JlYXRpb25PcHRpb25zXG4gKiBAcmV0dXJucyBTcWxpdGVBY2Nlc3NcbiAqIFxuICogQHRocm93c1xuICogaWYgZGF0YWJhc2UgdmVyc2lvbiA8IHRoZSB1c2VyIHZlcnNpb25cbiAqIGlmIG5vIGRhdGFiYXNlIG5hbWVcbiAqIGlmIGRyb3BwaW5nIHRhYmxlIHNjcmlwdHMgZXJyb3JcbiAqIGlmIGNyZWF0aW5nIHRhYmxlIHNjcmlwdHMgZXJyb3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIERiQnVpbGRlcihkYk5hbWU6IHN0cmluZywgb3B0aW9ucz86IERiQ3JlYXRpb25PcHRpb25zKSA6IFNxbGl0ZUFjY2VzcyB7XG4gICAgaWYgKCFkYk5hbWUpIHRocm93IFwiTXVzdCBzcGVjaWZ5IGEgZGIgbmFtZVwiO1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8ICh7XG4gICAgICAgIHZlcnNpb246IDFcbiAgICB9KTtcbiAgICAvLyBFbnN1cmUgdmVyc2lvbiBiZSAxIG9yIGdyZWF0ZXIgYW5kIHJldHVyblR5cGUgQVNfT0JKRUNUXG4gICAgb3B0aW9ucy52ZXJzaW9uID0gb3B0aW9ucy52ZXJzaW9uIHx8IDE7XG4gICAgb3B0aW9ucy5yZXR1cm5UeXBlID0gb3B0aW9ucy5yZXR1cm5UeXBlIHx8IFJldHVyblR5cGUuQVNfT0JKRUNUO1xuXG4gICAgY29uc3QgZGIgPSBfX29wZW5DcmVhdGVEYXRhQmFzZShkYk5hbWUsIDIvKlNRTElURV9PUEVOX1JFQURXUklURSovKTtcbiAgICBjb25zdCBjdXJyVmVyc2lvbiA9IF9fZGJWZXJzaW9uKGRiKTtcbiAgICBpZiAob3B0aW9ucy52ZXJzaW9uID4gY3VyclZlcnNpb24pIHtcbiAgICAgICAgX19kYlZlcnNpb24oZGIsIG9wdGlvbnMudmVyc2lvbik7XG4gICAgICAgIGNvbnN0IHRhYmxlQ3JlYXRlU2NyaXB0cyA9IG9wdGlvbnMuY3JlYXRlVGFibGVTY3JpcHRzRm4gJiYgb3B0aW9ucy5jcmVhdGVUYWJsZVNjcmlwdHNGbigpO1xuICAgICAgICBjb25zdCB0YWJsZURyb3B0U2NyaXB0cyA9IG9wdGlvbnMuZHJvcFRhYmxlU2NyaXB0c0ZuICYmIG9wdGlvbnMuZHJvcFRhYmxlU2NyaXB0c0ZuKCk7XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gRHJvcHBpbmcgYWxsIHRhYmxlc1xuICAgICAgICAgICAgaWYgKHRhYmxlRHJvcHRTY3JpcHRzKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgc2NyaXB0IGluIHRhYmxlRHJvcHRTY3JpcHRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnNvclJlZiA9IF9fZXhlY1F1ZXJ5QW5kUmV0dXJuU3RhdGVtZW50KHRhYmxlRHJvcHRTY3JpcHRzW3NjcmlwdF0sIGRiKTtcbiAgICAgICAgICAgICAgICAgICAgc3FsaXRlM19maW5hbGl6ZShjdXJzb3JSZWYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ3JlYXRpbmcgYWxsIHRhYmxlc1xuICAgICAgICAgICAgaWYgKHRhYmxlQ3JlYXRlU2NyaXB0cykge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IHNjcmlwdCBpbiB0YWJsZUNyZWF0ZVNjcmlwdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3Vyc29yUmVmID0gX19leGVjUXVlcnlBbmRSZXR1cm5TdGF0ZW1lbnQodGFibGVDcmVhdGVTY3JpcHRzW3NjcmlwdF0sIGRiKTtcbiAgICAgICAgICAgICAgICAgICAgc3FsaXRlM19maW5hbGl6ZShjdXJzb3JSZWYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHNxbGl0ZTNfY2xvc2UoZGIpO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAob3B0aW9ucy52ZXJzaW9uIDwgY3VyclZlcnNpb24pIHtcbiAgICAgICAgc3FsaXRlM19jbG9zZShkYik7XG4gICAgICAgIHRocm93IGBJdCBpcyBub3QgcG9zc2libGUgdG8gc2V0IHRoZSB2ZXJzaW9uICR7b3B0aW9ucy52ZXJzaW9ufSB0byBkYXRhYmFzZSwgYmVjYXVzZSBpcyBsb3dlciB0aGVuIGN1cnJlbnQgdmVyc2lvbiwgRGIgY3VycmVudCB2ZXJzaW9uIGlzICR7Y3VyclZlcnNpb259YDtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTcWxpdGVBY2Nlc3MoZGIsIG9wdGlvbnMucmV0dXJuVHlwZSk7XG59XG5cbi8qKiBwcml2YXRlIGZ1bmN0aW9uXG4gKiBnZXQgb3Igc2V0IHRoZSBkYXRhYmFzZSB1c2VyX3ZlcnNpb25cbiAqIEBwYXJhbSBkYiBzcWxpdGUzKlxuICogQHBhcmFtIHZlcnNpb24gXG4gKiBcbiAqIEByZXR1cm5zIG51bWJlcnx1bmRlZmluZWRcbiAqL1xuZnVuY3Rpb24gX19kYlZlcnNpb24oZGI6YW55LCB2ZXJzaW9uPzogbnVtYmVyKSB7XG4gICAgbGV0IHNxbCA9IFwiUFJBR01BIHVzZXJfdmVyc2lvblwiO1xuICAgIFxuICAgIGlmIChpc05hTih2ZXJzaW9uKSkge1xuICAgICAgICB2ZXJzaW9uID0gX19leGVjUXVlcnlSZXR1cm5PbmVBcnJheVJvdyhkYiwgc3FsKS5wb3AoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjdXJzb3JSZWYgPSBfX2V4ZWNRdWVyeUFuZFJldHVyblN0YXRlbWVudChgJHtzcWx9PSR7dmVyc2lvbn1gLCBkYik7XG4gICAgICAgIHNxbGl0ZTNfZmluYWxpemUoY3Vyc29yUmVmKTtcbiAgICB9XG4gICAgcmV0dXJuIHZlcnNpb247XG59XG5cbi8qKiBwcml2YXRlIGZ1bmN0aW9uXG4gKiBleGVjdXRlIGEgc3FsIHF1ZXJ5IGFuZCByZXR1cm4gdGhlIGZpcnN0IHJvd1xuICogQHBhcmFtIGRiIHNxbGl0ZTMqXG4gKiBAcGFyYW0gcXVlcnkgXG4gKiBcbiAqIEByZXR1cm4gQXJyYXk8YW55PlxuICovXG5mdW5jdGlvbiBfX2V4ZWNRdWVyeVJldHVybk9uZUFycmF5Um93KGRiOiBhbnksIHF1ZXJ5OiBzdHJpbmcpOiBhbnkge1xuICAgIGNvbnN0IGN1cnNvclJlZiA9IF9fZXhlY1F1ZXJ5QW5kUmV0dXJuU3RhdGVtZW50KHF1ZXJ5LCBkYik7XG4gICAgY29uc3QgX19wcm9jZXNzQ3Vyc29yID0gX19wcmVwYXJlVG9Qcm9jZXNzQ3Vyc29yKGN1cnNvclJlZik7XG4gICAgbGV0IHJlc3VsdCA9IF9fcHJvY2Vzc0N1cnNvcihSZXR1cm5UeXBlLkFTX0FSUkFZKTtcbiAgICByZXR1cm4gcmVzdWx0LnNoaWZ0KCk7XG59XG5cbi8qKlxuICogRXhwb3J0IFJldHVyblR5cGUgYW5kIERiQ3JlYXRpb25PcHRpb25zXG4gKi9cbmV4cG9ydCAqIGZyb20gXCIuL2NvbW1vbi9Db21tb25cIjsiXX0=