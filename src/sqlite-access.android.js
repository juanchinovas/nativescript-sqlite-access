"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var app = require("tns-core-modules/application");
//Super private variables
var _db;
var _dataReturnedType;
/**
 * This class allow you to connect to sqlite database on Android|iOS
 */
var SqliteAccess = /** @class */ (function () {
    /**
     * Default constructor
     * @param db android.database.sqlite.SQLiteDatabase
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
        return _db.insert(table, null, __mapToContentValues(values));
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
        return _db.replace(table, null, __mapToContentValues(values));
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
        return _db.update(table, __mapToContentValues(values), whereClause, __objectArrayToStringArray(whereArs));
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
        return _db.delete(table, whereClause, __objectArrayToStringArray(whereArgs));
    };
    /**
     * Execute a query selector
     * @param sql
     * @param params
     *
     * @returns Promise<Array<any>>
     */
    SqliteAccess.prototype.select = function (sql, params) {
        return new Promise(function (resolve, error) {
            var cursor = _db.rawQuery(sql, __objectArrayToStringArray(params));
            try {
                var toArrayOfObject = __prepareToProcessCursor(cursor);
                var result = toArrayOfObject(_dataReturnedType);
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
        return new Promise(function (resolve, error) {
            var cursor = _db.query(table, columns, selection, __objectArrayToStringArray(selectionArgs), groupBy, orderBy, limit);
            try {
                var toArrayOfObject = __prepareToProcessCursor(cursor);
                var result = toArrayOfObject(_dataReturnedType);
                resolve(result);
            }
            catch (ex) {
                error(ex);
            }
        });
    };
    /**
     * Execute a SQL script and do not return anything
     * @param sql
     */
    SqliteAccess.prototype.execSQL = function (sql) {
        _db.execSQL(sql);
    };
    /**
     * Open a transaction
     */
    SqliteAccess.prototype.beginTransact = function () {
        _db.beginTransaction();
    };
    /**
     * Commit the transaction
     */
    SqliteAccess.prototype.commit = function () {
        _db.setTransactionSuccessful();
        _db.endTransaction();
    };
    /**
     * Rollback a transaction
     */
    SqliteAccess.prototype.rollback = function () {
        _db.endTransaction();
    };
    /**
     * Close the database connection
     */
    SqliteAccess.prototype.close = function () {
        if (_db === null) { //already closed
            return;
        }
        _db.close();
        _db = null;
    };
    return SqliteAccess;
}());
/** private function
 * Curring function to loop android.database.Cursor
 * @param cursor android.database.Cursor
 *
 * @returns (returnType: ReturnType) => Array<any>;
 */
function __prepareToProcessCursor(cursor) {
    return function (returnType) {
        var result = [];
        if (cursor.getCount() > 0) {
            while (cursor.moveToNext()) {
                result.push(__getRowValues(cursor, returnType));
            }
        }
        cursor.close();
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
    var columnCount = cursor.getColumnCount();
    for (var i = 0; i < columnCount; i++) {
        primitiveType = cursor.getType(i);
        columnName = cursor.getColumnName(i);
        switch (primitiveType) {
            case android.database.Cursor.FIELD_TYPE_INTEGER:
                value = cursor.getLong(i);
                break;
            case android.database.Cursor.FIELD_TYPE_FLOAT:
                value = cursor.getFloat(i);
                break;
            case android.database.Cursor.FIELD_TYPE_STRING:
                value = cursor.getString(i);
                break;
            case android.database.Cursor.FIELD_TYPE_BLOB:
                //uncomment the code below if you wanna use it and change continue for break
                //value = cursor.getBlob(i);
                continue;
            case android.database.Cursor.FIELD_TYPE_NULL:
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
 * @returns android.database.sqlite.SQLiteDatabase
 */
function __openCreateDataBase(dbName, mode) {
    if (dbName === ":memory:") {
        return android.database.sqlite.SQLiteDatabase.create(null);
    }
    //Getting a native File object
    var file = __getContext().getDatabasePath(dbName);
    //Check if database file does not exist, then create dir
    if (!file.exists()) {
        file.getParentFile().mkdirs();
        file.getParentFile().setReadable(true);
        file.getParentFile().setWritable(true);
    }
    mode = mode | android.database.sqlite.SQLiteDatabase.CREATE_IF_NECESSARY;
    return android.database.sqlite.SQLiteDatabase.openDatabase(file.getAbsolutePath(), null, mode);
}
/** private function
 * Turn an Array of any to Array of string to match android API
 * @param params sql queries params
 * @returns Array<string>
 */
function __objectArrayToStringArray(params) {
    if (!params)
        return null;
    var stringArray = [];
    for (var key in params) {
        stringArray.push(params[key] && params[key].toString() || null);
    }
    return stringArray;
}
/**
 * Map a key/value JS object to android.content.ContentValues
 * @param values { [key: string]: any; }
 * @returns android.content.ContentValues
 */
function __mapToContentValues(values) {
    var contentValues = new android.content.ContentValues();
    for (var key in values) {
        if (values.hasOwnProperty(key)
            && values[key] !== null && values[key] !== undefined) {
            contentValues.put(key, values[key]);
        }
        else {
            contentValues.putNull(key);
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
function DbBuilder(dbName, options) {
    if (!dbName)
        throw "Must specify a db name";
    options = options || {
        version: 1
    };
    // Ensure version be 1 or greater and returnType AS_OBJECT
    options.version = options.version || 1;
    options.returnType = options.returnType || 0 /* AS_OBJECT */;
    var db = __openCreateDataBase(dbName, android.database.sqlite.SQLiteDatabase.OPEN_READWRITE);
    var curVersion = db.getVersion();
    if (options.version > curVersion) {
        db.setVersion(options.version);
        var tableCreateScripts = options.createTableScriptsFn && options.createTableScriptsFn();
        var tableDroptScripts = options.dropTableScriptsFn && options.dropTableScriptsFn();
        try {
            // Dropping all tables
            if (tableDroptScripts) {
                for (var script in tableDroptScripts) {
                    db.execSQL(tableDroptScripts[script]);
                }
            }
            // Creating all tables
            if (tableCreateScripts) {
                for (var script in tableCreateScripts) {
                    db.execSQL(tableCreateScripts[script]);
                }
            }
        }
        catch (error) {
            db.setVersion(curVersion);
            db.close();
            throw error;
        }
    }
    else if (options.version < curVersion) {
        db.close();
        throw "It is not possible to set the version " + options.version + " to database, because is lower then current version, Db current version is " + curVersion;
    }
    return new SqliteAccess(db, options.returnType);
}
exports.DbBuilder = DbBuilder;
/**
 * Export ReturnType and DbCreationOptions
 */
__export(require("./common/Common"));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3FsaXRlLWFjY2Vzcy5hbmRyb2lkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3FsaXRlLWFjY2Vzcy5hbmRyb2lkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQ0Esa0RBQW9EO0FBR3BELHlCQUF5QjtBQUN6QixJQUFJLEdBQTJDLENBQUM7QUFDaEQsSUFBSSxpQkFBNkIsQ0FBQztBQUVsQzs7R0FFRztBQUVIO0lBRUk7Ozs7T0FJRztJQUNILHNCQUFZLEVBQTBDLEVBQ2xELFVBQXNCO1FBQ2xCLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDVCxpQkFBaUIsR0FBRyxVQUFVLENBQUM7SUFDdkMsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0gsNkJBQU0sR0FBTixVQUFPLEtBQWEsRUFBRSxNQUErQjtRQUNqRCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ2pFLENBQUM7SUFFRDs7Ozs7Ozs7T0FRRztJQUNILDhCQUFPLEdBQVAsVUFBUSxLQUFhLEVBQUUsTUFBK0I7UUFDbEQsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsb0JBQW9CLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7T0FVRztJQUNILDZCQUFNLEdBQU4sVUFBTyxLQUFhLEVBQUUsTUFBK0IsRUFBRSxXQUFtQixFQUFFLFFBQWU7UUFDdkYsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxXQUFXLEVBQUUsMEJBQTBCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUM5RyxDQUFDO0lBRUQ7Ozs7Ozs7OztPQVNHO0lBQ0gsNkJBQU0sR0FBTixVQUFPLEtBQWEsRUFBRSxXQUFvQixFQUFFLFNBQWlCO1FBQ3pELE9BQU8sR0FBRyxD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RUFBRTtnQkFDcEIsS0FBSyxJQUFJLE1BQU0sSUFBSSxrQkFBa0IsRUFBRTtvQkFDbkMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2lCQUMxQzthQUNKO1NBQ0o7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNaLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDMUIsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ1gsTUFBTSxLQUFLLENBQUM7U0FDZjtLQUVKO1NBQU0sSUFBSSxPQUFPLENBQUMsT0FBTyxHQUFHLFVBQVUsRUFBRTtRQUNyQyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDWCxNQUFNLDJDQUF5QyxPQUFPLENBQUMsT0FBTyxtRkFBOEUsVUFBWSxDQUFDO0tBQzVKO0lBQ0QsT0FBTyxJQUFJLFlBQVksQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3BELENBQUM7QUF6Q0QsOEJBeUNDO0FBRUQ7O0dBRUc7QUFDSCxxQ0FBZ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJRGF0YWJhc2UgfSBmcm9tICcuL2NvbW1vbi9JRGF0YWJhc2UnO1xuaW1wb3J0ICogYXMgYXBwIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2FwcGxpY2F0aW9uXCI7XG5pbXBvcnQgeyBEYkNyZWF0aW9uT3B0aW9ucywgUmV0dXJuVHlwZSB9IGZyb20gJy4vY29tbW9uL0NvbW1vbic7XG5cbi8vU3VwZXIgcHJpdmF0ZSB2YXJpYWJsZXNcbmxldCBfZGI6IGFuZHJvaWQuZGF0YWJhc2Uuc3FsaXRlLlNRTGl0ZURhdGFiYXNlO1xubGV0IF9kYXRhUmV0dXJuZWRUeXBlOiBSZXR1cm5UeXBlO1xuXG4vKipcbiAqIFRoaXMgY2xhc3MgYWxsb3cgeW91IHRvIGNvbm5lY3QgdG8gc3FsaXRlIGRhdGFiYXNlIG9uIEFuZHJvaWR8aU9TXG4gKi9cblxuY2xhc3MgU3FsaXRlQWNjZXNzIGltcGxlbWVudHMgSURhdGFiYXNlIHtcblxuICAgIC8qKlxuICAgICAqIERlZmF1bHQgY29uc3RydWN0b3JcbiAgICAgKiBAcGFyYW0gZGIgYW5kcm9pZC5kYXRhYmFzZS5zcWxpdGUuU1FMaXRlRGF0YWJhc2VcbiAgICAgKiBAcGFyYW0gcmV0dXJuVHlwZSBSZXR1cm5UeXBlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZGI6IGFuZHJvaWQuZGF0YWJhc2Uuc3FsaXRlLlNRTGl0ZURhdGFiYXNlLCBcbiAgICAgICAgcmV0dXJuVHlwZTogUmV0dXJuVHlwZSkge1xuICAgICAgICAgICAgX2RiID0gZGI7XG4gICAgICAgICAgICBfZGF0YVJldHVybmVkVHlwZSA9IHJldHVyblR5cGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5zZXJ0IGEgcm93IGludG8gdGFibGUgd2l0aCB0aGUgdmFsdWVzIGFuZCByZXR1cm4gdGhlIGxhc3RcbiAgICAgKiBpbnNlcnRlZCBpZCBpbiB0aGUgdGFibGVcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gdGFibGUgXG4gICAgICogQHBhcmFtIHZhbHVlcyBcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyBudW1iZXJcbiAgICAgKi9cbiAgICBpbnNlcnQodGFibGU6IHN0cmluZywgdmFsdWVzOiB7IFtrZXk6IHN0cmluZ106IGFueTsgfSk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiBfZGIuaW5zZXJ0KHRhYmxlLCBudWxsLCBfX21hcFRvQ29udGVudFZhbHVlcyh2YWx1ZXMpKTtcbiAgICB9ICAgIFxuICAgIFxuICAgIC8qKlxuICAgICAqIFJlcGxhY2UgYSByb3cgaW4gdGhlIHRhYmxlIHdpdGggdGhlIHZhbHVlcyBhbmQgXG4gICAgICogcmV0dXJuIHRoZSBudW1iZXIgb2Ygcm93cyBhZmZlY3RlZFxuICAgICAqIFxuICAgICAqIEBwYXJhbSB0YWJsZSBcbiAgICAgKiBAcGFyYW0gdmFsdWVzXG4gICAgICogXG4gICAgICogQHJldHVybnMgbnVtYmVyIFxuICAgICAqL1xuICAgIHJlcGxhY2UodGFibGU6IHN0cmluZywgdmFsdWVzOiB7IFtrZXk6IHN0cmluZ106IGFueTsgfSk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiBfZGIucmVwbGFjZSh0YWJsZSwgbnVsbCwgX19tYXBUb0NvbnRlbnRWYWx1ZXModmFsdWVzKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGEgcm93IGluIHRoZSB0YWJsZSB3aXRoIHRoZSB2YWx1ZXMgYW5kIHRoZSBmaWx0ZXJzLiBcbiAgICAgKiByZXR1cm4gdGhlIG51bWJlciBvZiByb3dzIGFmZmVjdGVkXG4gICAgICogXG4gICAgICogQHBhcmFtIHRhYmxlIFxuICAgICAqIEBwYXJhbSB2YWx1ZXNcbiAgICAgKiBAcGFyYW0gd2hlcmVDbGF1c2UgXG4gICAgICogQHBhcmFtIHdoZXJlQXJzIFxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIG51bWJlciBcbiAgICAgKi9cbiAgICB1cGRhdGUodGFibGU6IHN0cmluZywgdmFsdWVzOiB7IFtrZXk6IHN0cmluZ106IGFueTsgfSwgd2hlcmVDbGF1c2U6IHN0cmluZywgd2hlcmVBcnM6IGFueVtdKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIF9kYi51cGRhdGUodGFibGUsIF9fbWFwVG9Db250ZW50VmFsdWVzKHZhbHVlcyksIHdoZXJlQ2xhdXNlLCBfX29iamVjdEFycmF5VG9TdHJpbmdBcnJheSh3aGVyZUFycykpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlbGV0ZSBhIHJvdyBmcm9tIHRoZSB0YWJsZSB3aXRoIHRoZSBmaWx0ZXIuXG4gICAgICogcmV0dXJuIHRoZSBudW1iZXIgb2Ygcm93cyBhZmZlY3RlZFxuICAgICAqIFxuICAgICAqIEBwYXJhbSB0YWJsZSBcbiAgICAgKiBAcGFyYW0gd2hlcmVDbGF1c2U/IFxuICAgICAqIEBwYXJhbSB3aGVyZUFyZ3M/XG4gICAgICogXG4gICAgICogQHJldHVybnMgbnVtYmVyXG4gICAgICovXG4gICAgZGVsZXRlKHRhYmxlOiBzdHJpbmcsIHdoZXJlQ2xhdXNlPzogc3RyaW5nLCB3aGVyZUFyZ3M/OiBhbnlbXSk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiBfZGIuZGVsZXRlKHRhYmxlLCB3aGVyZUNsYXVzZSwgX19vYmplY3RBcnJheVRvU3RyaW5nQXJyYXkod2hlcmVBcmdzKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZSBhIHF1ZXJ5IHNlbGVjdG9yXG4gICAgICogQHBhcmFtIHNxbCBcbiAgICAgKiBAcGFyYW0gcGFyYW1zIFxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIFByb21pc2U8QXJyYXk8YW55Pj5cbiAgICAgKi9cbiAgICBzZWxlY3Qoc3FsOiBzdHJpbmcsIHBhcmFtcz86IGFueVtdKTogUHJvbWlzZTxBcnJheTxhbnk+PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCBlcnJvcikge1xuICAgICAgICAgICAgbGV0IGN1cnNvciA9ICBfZGIucmF3UXVlcnkoc3FsLCBfX29iamVjdEFycmF5VG9TdHJpbmdBcnJheShwYXJhbXMpKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdG9BcnJheU9mT2JqZWN0ID0gX19wcmVwYXJlVG9Qcm9jZXNzQ3Vyc29yKGN1cnNvcik7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdG9BcnJheU9mT2JqZWN0KF9kYXRhUmV0dXJuZWRUeXBlKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICB9IGNhdGNoKGV4KSB7XG4gICAgICAgICAgICAgICAgZXJyb3IoZXgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGUgYSBxdWVyeSBzZWxlY3RvclxuICAgICAqIFxuICAgICAqIEBwYXJhbSB0YWJsZSBcbiAgICAgKiBAcGFyYW0gY29sdW1ucyBcbiAgICAgKiBAcGFyYW0gc2VsZWN0aW9uIFxuICAgICAqIEBwYXJhbSBzZWxlY3Rpb25BcmdzIFxuICAgICAqIEBwYXJhbSBncm91cEJ5IFxuICAgICAqIEBwYXJhbSBvcmRlckJ5IFxuICAgICAqIEBwYXJhbSBsaW1pdCBcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyBQcm9taXNlPEFycmF5PGFueT4+XG4gICAgICovXG4gICAgcXVlcnkodGFibGU6IHN0cmluZywgY29sdW1ucz86IHN0cmluZ1tdLCBzZWxlY3Rpb24/OiBzdHJpbmcsIHNlbGVjdGlvbkFyZ3M/OiBhbnlbXSwgZ3JvdXBCeT86IHN0cmluZywgb3JkZXJCeT86IHN0cmluZywgbGltaXQ/OiBzdHJpbmcpOiBQcm9taXNlPEFycmF5PGFueT4+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIGVycm9yKSB7XG4gICAgICAgICAgICBsZXQgY3Vyc29yID0gIF9kYi5xdWVyeSh0YWJsZSwgY29sdW1ucywgc2VsZWN0aW9uLCBfX29iamVjdEFycmF5VG9TdHJpbmdBcnJheShzZWxlY3Rpb25BcmdzKSwgZ3JvdXBCeSwgb3JkZXJCeSwgbGltaXQpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0b0FycmF5T2ZPYmplY3QgPSBfX3ByZXBhcmVUb1Byb2Nlc3NDdXJzb3IoY3Vyc29yKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB0b0FycmF5T2ZPYmplY3QoX2RhdGFSZXR1cm5lZFR5cGUpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgIH0gY2F0Y2goZXgpIHtcbiAgICAgICAgICAgICAgICBlcnJvcihleClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZSBhIFNRTCBzY3JpcHQgYW5kIGRvIG5vdCByZXR1cm4gYW55dGhpbmdcbiAgICAgKiBAcGFyYW0gc3FsIFxuICAgICAqL1xuICAgIGV4ZWNTUUwoc3FsOiBzdHJpbmcpIHtcbiAgICAgICAgX2RiLmV4ZWNTUUwoc3FsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPcGVuIGEgdHJhbnNhY3Rpb25cbiAgICAgKi9cbiAgICBiZWdpblRyYW5zYWN0KCkge1xuICAgICAgICBfZGIuYmVnaW5UcmFuc2FjdGlvbigpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbW1pdCB0aGUgdHJhbnNhY3Rpb25cbiAgICAgKi9cbiAgICBjb21taXQoKSB7XG4gICAgICAgIF9kYi5zZXRUcmFuc2FjdGlvblN1Y2Nlc3NmdWwoKTtcbiAgICAgICAgX2RiLmVuZFRyYW5zYWN0aW9uKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUm9sbGJhY2sgYSB0cmFuc2FjdGlvblxuICAgICAqL1xuICAgIHJvbGxiYWNrKCkge1xuICAgICAgICBfZGIuZW5kVHJhbnNhY3Rpb24oKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDbG9zZSB0aGUgZGF0YWJhc2UgY29ubmVjdGlvblxuICAgICAqL1xuICAgIGNsb3NlKCk6IHZvaWQge1xuICAgICAgICBpZiAoX2RiID09PSBudWxsKSB7IC8vYWxyZWFkeSBjbG9zZWRcbiAgICAgICAgICAgIHJldHVybjsgXG4gICAgICAgIH1cblxuICAgICAgICBfZGIuY2xvc2UoKTtcbiAgICAgICAgX2RiID0gbnVsbDtcbiAgICB9XG59XG5cbi8qKiBwcml2YXRlIGZ1bmN0aW9uXG4gKiBDdXJyaW5nIGZ1bmN0aW9uIHRvIGxvb3AgYW5kcm9pZC5kYXRhYmFzZS5DdXJzb3JcbiAqIEBwYXJhbSBjdXJzb3IgYW5kcm9pZC5kYXRhYmFzZS5DdXJzb3JcbiAqIFxuICogQHJldHVybnMgKHJldHVyblR5cGU6IFJldHVyblR5cGUpID0+IEFycmF5PGFueT47XG4gKi9cbmZ1bmN0aW9uIF9fcHJlcGFyZVRvUHJvY2Vzc0N1cnNvcihjdXJzb3I6IGFuZHJvaWQuZGF0YWJhc2UuQ3Vyc29yKTogKHJldHVyblR5cGU6IFJldHVyblR5cGUpPT5BcnJheTxhbnk+IHtcbiAgICByZXR1cm4gKHJldHVyblR5cGU6IFJldHVyblR5cGUpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gW107XG4gICAgICAgIGlmIChjdXJzb3IuZ2V0Q291bnQoKSA+IDApIHtcbiAgICAgICAgICAgIHdoaWxlICggY3Vyc29yLm1vdmVUb05leHQoKSApIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCggX19nZXRSb3dWYWx1ZXMoY3Vyc29yLCByZXR1cm5UeXBlKSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGN1cnNvci5jbG9zZSgpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cblxuLyoqIHByaXZhdGUgZnVuY3Rpb25cbiAqIFByb2Nlc3MgdGhlIHNxbGl0ZSBjdXJzb3IgYW5kIHJldHVybiBhIFxuICoganMgb2JqZWN0IHdpdGggY29sdW1uL3ZhbHVlIG9yIGFuIGFycmF5IHJvd1xuICogXG4gKiBAcGFyYW0gY3Vyc29yIFxuICogQHBhcmFtIHJldHVyblR5cGUgXG4gKiBAcmV0dXJucyBKUyAgYXJyYXkgb3Igb2JqZWN0IGxpa2Uge1tjb2x1bW46c3RyaW5nXTogYW55fVxuICovXG5mdW5jdGlvbiBfX2dldFJvd1ZhbHVlcyhjdXJzb3I6IGFuZHJvaWQuZGF0YWJhc2UuQ3Vyc29yLCByZXR1cm5UeXBlOiBSZXR1cm5UeXBlKTogYW55IHtcblxuICAgIGxldCByb3dWYWx1ZTogYW55ID0ge307XG4gICAgaWYgKHJldHVyblR5cGUgPT09IFJldHVyblR5cGUuQVNfQVJSQVkpIHtcbiAgICAgICAgcm93VmFsdWUgPSBbXTtcbiAgICB9XG5cbiAgICBsZXQgcHJpbWl0aXZlVHlwZSA9IG51bGw7XG4gICAgbGV0IGNvbHVtbk5hbWUgPSAnJztcbiAgICBsZXQgdmFsdWUgPSBudWxsO1xuICAgIGxldCBjb2x1bW5Db3VudDpudW1iZXIgPSBjdXJzb3IuZ2V0Q29sdW1uQ291bnQoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbHVtbkNvdW50OyBpKyspIHtcbiAgICAgICAgcHJpbWl0aXZlVHlwZSA9IGN1cnNvci5nZXRUeXBlKGkpO1xuICAgICAgICBjb2x1bW5OYW1lID0gY3Vyc29yLmdldENvbHVtbk5hbWUoaSk7XG4gICAgICAgIHN3aXRjaCAocHJpbWl0aXZlVHlwZSkge1xuICAgICAgICAgICAgY2FzZSBhbmRyb2lkLmRhdGFiYXNlLkN1cnNvci5GSUVMRF9UWVBFX0lOVEVHRVI6IFxuICAgICAgICAgICAgICAgIHZhbHVlID0gY3Vyc29yLmdldExvbmcoaSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIGFuZHJvaWQuZGF0YWJhc2UuQ3Vyc29yLkZJRUxEX1RZUEVfRkxPQVQ6IFxuICAgICAgICAgICAgICAgIHZhbHVlID0gY3Vyc29yLmdldEZsb2F0KGkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBhbmRyb2lkLmRhdGFiYXNlLkN1cnNvci5GSUVMRF9UWVBFX1NUUklORzogXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBjdXJzb3IuZ2V0U3RyaW5nKGkpOyAgICBcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgYW5kcm9pZC5kYXRhYmFzZS5DdXJzb3IuRklFTERfVFlQRV9CTE9COlxuICAgICAgICAgICAgICAgIC8vdW5jb21tZW50IHRoZSBjb2RlIGJlbG93IGlmIHlvdSB3YW5uYSB1c2UgaXQgYW5kIGNoYW5nZSBjb250aW51ZSBmb3IgYnJlYWtcbiAgICAgICAgICAgICAgICAvL3ZhbHVlID0gY3Vyc29yLmdldEJsb2IoaSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICBjYXNlIGFuZHJvaWQuZGF0YWJhc2UuQ3Vyc29yLkZJRUxEX1RZUEVfTlVMTDpcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgLy8gSWYgcmVzdWx0IHdhbnRlZCBhcyBhcnJheSBvZiBhcnJheVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyb3dWYWx1ZSkgJiYgcmV0dXJuVHlwZSA9PT0gUmV0dXJuVHlwZS5BU19BUlJBWSkge1xuICAgICAgICAgICAgcm93VmFsdWUucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJvd1ZhbHVlW2NvbHVtbk5hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIHJldHVybiByb3dWYWx1ZTtcbn1cblxuLyoqIHByaXZhdGUgZnVuY3Rpb25cbiAqIG9wZW4gb3IgY3JlYXRlIGEgcmVhZC13cml0ZSBkYXRhYmFzZSwgcGVybWFuZW50bHkgb3IgaW4gbWVtb3J5XG4gKiBAcGFyYW0gZGJOYW1lIGRhdGFiYXNlIG5hbWVcbiAqIEBwYXJhbSBtb2RlIG9wZW5uZXNzIG1vZGVcbiAqIEByZXR1cm5zIGFuZHJvaWQuZGF0YWJhc2Uuc3FsaXRlLlNRTGl0ZURhdGFiYXNlXG4gKi9cbmZ1bmN0aW9uIF9fb3BlbkNyZWF0ZURhdGFCYXNlKGRiTmFtZTogc3RyaW5nLCBtb2RlOiBudW1iZXIpOiBhbmRyb2lkLmRhdGFiYXNlLnNxbGl0ZS5TUUxpdGVEYXRhYmFzZSB7XG4gICAgaWYgKGRiTmFtZSA9PT0gXCI6bWVtb3J5OlwiKSB7XG4gICAgICAgIHJldHVybiBhbmRyb2lkLmRhdGFiYXNlLnNxbGl0ZS5TUUxpdGVEYXRhYmFzZS5jcmVhdGUobnVsbCk7XG4gICAgfVxuICAgIC8vR2V0dGluZyBhIG5hdGl2ZSBGaWxlIG9iamVjdFxuICAgIGNvbnN0IGZpbGU6IGphdmEuaW8uRmlsZSA9IDxqYXZhLmlvLkZpbGU+X19nZXRDb250ZXh0KCkuZ2V0RGF0YWJhc2VQYXRoKGRiTmFtZSk7XG4gICAgLy9DaGVjayBpZiBkYXRhYmFzZSBmaWxlIGRvZXMgbm90IGV4aXN0LCB0aGVuIGNyZWF0ZSBkaXJcbiAgICBpZighZmlsZS5leGlzdHMoKSkge1xuICAgICAgICBmaWxlLmdldFBhcmVudEZpbGUoKS5ta2RpcnMoKTtcbiAgICAgICAgZmlsZS5nZXRQYXJlbnRGaWxlKCkuc2V0UmVhZGFibGUodHJ1ZSk7XG4gICAgICAgIGZpbGUuZ2V0UGFyZW50RmlsZSgpLnNldFdyaXRhYmxlKHRydWUpO1xuICAgIH1cbiAgICBcbiAgICBtb2RlID0gIG1vZGUgfCBhbmRyb2lkLmRhdGFiYXNlLnNxbGl0ZS5TUUxpdGVEYXRhYmFzZS5DUkVBVEVfSUZfTkVDRVNTQVJZO1xuICAgIHJldHVybiBhbmRyb2lkLmRhdGFiYXNlLnNxbGl0ZS5TUUxpdGVEYXRhYmFzZS5vcGVuRGF0YWJhc2UoZmlsZS5nZXRBYnNvbHV0ZVBhdGgoKSwgbnVsbCwgbW9kZSk7XG59XG5cbi8qKiBwcml2YXRlIGZ1bmN0aW9uXG4gKiBUdXJuIGFuIEFycmF5IG9mIGFueSB0byBBcnJheSBvZiBzdHJpbmcgdG8gbWF0Y2ggYW5kcm9pZCBBUElcbiAqIEBwYXJhbSBwYXJhbXMgc3FsIHF1ZXJpZXMgcGFyYW1zXG4gKiBAcmV0dXJucyBBcnJheTxzdHJpbmc+XG4gKi9cbmZ1bmN0aW9uIF9fb2JqZWN0QXJyYXlUb1N0cmluZ0FycmF5KHBhcmFtczogQXJyYXk8YW55Pikge1xuICAgIGlmICghcGFyYW1zKSByZXR1cm4gbnVsbDtcblxuICAgIGxldCBzdHJpbmdBcnJheTpBcnJheTxzdHJpbmc+ID0gW107XG4gICAgZm9yKGxldCBrZXkgaW4gcGFyYW1zKSB7XG4gICAgICAgIHN0cmluZ0FycmF5LnB1c2goIHBhcmFtc1trZXldICYmIHBhcmFtc1trZXldLnRvU3RyaW5nKCkgfHwgbnVsbCApO1xuICAgIH1cbiAgICByZXR1cm4gc3RyaW5nQXJyYXk7XG59XG5cbi8qKlxuICogTWFwIGEga2V5L3ZhbHVlIEpTIG9iamVjdCB0byBhbmRyb2lkLmNvbnRlbnQuQ29udGVudFZhbHVlc1xuICogQHBhcmFtIHZhbHVlcyB7IFtrZXk6IHN0cmluZ106IGFueTsgfVxuICogQHJldHVybnMgYW5kcm9pZC5jb250ZW50LkNvbnRlbnRWYWx1ZXNcbiAqL1xuZnVuY3Rpb24gX19tYXBUb0NvbnRlbnRWYWx1ZXModmFsdWVzOiB7IFtrZXk6IHN0cmluZ106IGFueTsgfSkge1xuICAgIGxldCBjb250ZW50VmFsdWVzID0gbmV3IGFuZHJvaWQuY29udGVudC5Db250ZW50VmFsdWVzKCk7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gdmFsdWVzKSB7XG4gICAgICAgIGlmICh2YWx1ZXMuaGFzT3duUHJvcGVydHkoa2V5KSBcbiAgICAgICAgICAgICYmIHZhbHVlc1trZXldICE9PSBudWxsICYmIHZhbHVlc1trZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnRlbnRWYWx1ZXMucHV0KGtleSwgdmFsdWVzW2tleV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29udGVudFZhbHVlcy5wdXROdWxsKGtleSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnRWYWx1ZXM7XG59XG5cbi8qKiBwcml2YXRlIGZ1bmN0aW9uXG4gKiBHZXQgYW5kIHJldHVybiBBbmRyb2lkIGFwcCBDb250ZXh0XG4gKi9cbmZ1bmN0aW9uIF9fZ2V0Q29udGV4dCgpIHtcbiAgICByZXR1cm4gKGFwcC5hbmRyb2lkLmNvbnRleHQgXG4gICAgICAgICAgICB8fCAoYXBwLmdldE5hdGl2ZUFwcGxpY2F0aW9uICYmIGFwcC5nZXROYXRpdmVBcHBsaWNhdGlvbigpKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuIGluc3RhbmNlIG9mIGFuZHJvaWQuZGF0YWJhc2Uuc3FsaXRlLlNRTGl0ZURhdGFiYXNlLCBleGVjdXRlIHRoZSBkcm9wcGluZyBhbmQgY3JlYXRpbmcgdGFibGVzIHNjcmlwdHMgaWYgZXhpc3RzXG4gKiBhbmQgaWYgdGhlIHZlcnNpb24gbnVtYmVyIGlzIGdyZWF0ZXIgdGhlIGRhdGFiYXNlIHZlcnNpb25cbiAqIEBwYXJhbSBkYk5hbWUgU3RyaW5nXG4gKiBAcGFyYW0gb3B0aW9ucyBEYkNyZWF0aW9uT3B0aW9uc1xuICogQHJldHVybnMgU3FsaXRlQWNjZXNzXG4gKiBcbiAqIEB0aHJvd3NcbiAqIGlmIGRhdGFiYXNlIHZlcnNpb24gPCB0aGUgdXNlciB2ZXJzaW9uXG4gKiBpZiBubyBkYXRhYmFzZSBuYW1lXG4gKiBpZiBkcm9wcGluZyB0YWJsZSBzY3JpcHRzIGVycm9yXG4gKiBpZiBjcmVhdGluZyB0YWJsZSBzY3JpcHRzIGVycm9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBEYkJ1aWxkZXIoZGJOYW1lOiBzdHJpbmcsIG9wdGlvbnM/OiBEYkNyZWF0aW9uT3B0aW9ucykgOiBTcWxpdGVBY2Nlc3Mge1xuICAgIGlmICghZGJOYW1lKSB0aHJvdyBcIk11c3Qgc3BlY2lmeSBhIGRiIG5hbWVcIjtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHtcbiAgICAgICAgdmVyc2lvbjogMVxuICAgIH07XG4gICAgLy8gRW5zdXJlIHZlcnNpb24gYmUgMSBvciBncmVhdGVyIGFuZCByZXR1cm5UeXBlIEFTX09CSkVDVFxuICAgIG9wdGlvbnMudmVyc2lvbiA9IG9wdGlvbnMudmVyc2lvbiB8fCAxO1xuICAgIG9wdGlvbnMucmV0dXJuVHlwZSA9IG9wdGlvbnMucmV0dXJuVHlwZSB8fCBSZXR1cm5UeXBlLkFTX09CSkVDVDtcblxuICAgIGNvbnN0IGRiID0gX19vcGVuQ3JlYXRlRGF0YUJhc2UoZGJOYW1lLCBhbmRyb2lkLmRhdGFiYXNlLnNxbGl0ZS5TUUxpdGVEYXRhYmFzZS5PUEVOX1JFQURXUklURSk7XG4gICAgY29uc3QgY3VyVmVyc2lvbiA9IGRiLmdldFZlcnNpb24oKTtcbiAgICBpZiAob3B0aW9ucy52ZXJzaW9uID4gY3VyVmVyc2lvbikge1xuICAgICAgICBkYi5zZXRWZXJzaW9uKG9wdGlvbnMudmVyc2lvbik7XG4gICAgICAgIGNvbnN0IHRhYmxlQ3JlYXRlU2NyaXB0cyA9IG9wdGlvbnMuY3JlYXRlVGFibGVTY3JpcHRzRm4gJiYgb3B0aW9ucy5jcmVhdGVUYWJsZVNjcmlwdHNGbigpO1xuICAgICAgICBjb25zdCB0YWJsZURyb3B0U2NyaXB0cyA9IG9wdGlvbnMuZHJvcFRhYmxlU2NyaXB0c0ZuICYmIG9wdGlvbnMuZHJvcFRhYmxlU2NyaXB0c0ZuKCk7XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gRHJvcHBpbmcgYWxsIHRhYmxlc1xuICAgICAgICAgICAgaWYgKHRhYmxlRHJvcHRTY3JpcHRzKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgc2NyaXB0IGluIHRhYmxlRHJvcHRTY3JpcHRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGRiLmV4ZWNTUUwodGFibGVEcm9wdFNjcmlwdHNbc2NyaXB0XSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQ3JlYXRpbmcgYWxsIHRhYmxlc1xuICAgICAgICAgICAgaWYgKHRhYmxlQ3JlYXRlU2NyaXB0cykge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IHNjcmlwdCBpbiB0YWJsZUNyZWF0ZVNjcmlwdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgZGIuZXhlY1NRTCh0YWJsZUNyZWF0ZVNjcmlwdHNbc2NyaXB0XSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgZGIuc2V0VmVyc2lvbihjdXJWZXJzaW9uKTtcbiAgICAgICAgICAgIGRiLmNsb3NlKCk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuXG4gICAgfSBlbHNlIGlmIChvcHRpb25zLnZlcnNpb24gPCBjdXJWZXJzaW9uKSB7XG4gICAgICAgIGRiLmNsb3NlKCk7XG4gICAgICAgIHRocm93IGBJdCBpcyBub3QgcG9zc2libGUgdG8gc2V0IHRoZSB2ZXJzaW9uICR7b3B0aW9ucy52ZXJzaW9ufSB0byBkYXRhYmFzZSwgYmVjYXVzZSBpcyBsb3dlciB0aGVuIGN1cnJlbnQgdmVyc2lvbiwgRGIgY3VycmVudCB2ZXJzaW9uIGlzICR7Y3VyVmVyc2lvbn1gO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFNxbGl0ZUFjY2VzcyhkYiwgb3B0aW9ucy5yZXR1cm5UeXBlKTtcbn1cblxuLyoqXG4gKiBFeHBvcnQgUmV0dXJuVHlwZSBhbmQgRGJDcmVhdGlvbk9wdGlvbnNcbiAqL1xuZXhwb3J0ICogZnJvbSBcIi4vY29tbW9uL0NvbW1vblwiOyJdfQ==