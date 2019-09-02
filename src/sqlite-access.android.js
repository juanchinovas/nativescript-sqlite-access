"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var app = require("tns-core-modules/application");
var _db;
var _dataReturnedType;
var SqliteAccess = (function () {
    function SqliteAccess(db, returnType) {
        _db = db;
        _dataReturnedType = returnType;
    }
    SqliteAccess.prototype.insert = function (table, values) {
        return _db.insert(table, null, __mapToContentValues(values));
    };
    SqliteAccess.prototype.replace = function (table, values) {
        return _db.replace(table, null, __mapToContentValues(values));
    };
    SqliteAccess.prototype.update = function (table, values, whereClause, whereArs) {
        return _db.update(table, __mapToContentValues(values), whereClause, __objectArrayToStringArray(whereArs));
    };
    SqliteAccess.prototype.delete = function (table, whereClause, whereArgs) {
        return _db.delete(table, whereClause, __objectArrayToStringArray(whereArgs));
    };
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
    SqliteAccess.prototype.execSQL = function (sql) {
        _db.execSQL(sql);
    };
    SqliteAccess.prototype.beginTransact = function () {
        _db.beginTransaction();
    };
    SqliteAccess.prototype.commit = function () {
        _db.setTransactionSuccessful();
        _db.endTransaction();
    };
    SqliteAccess.prototype.rollback = function () {
        _db.endTransaction();
    };
    SqliteAccess.prototype.close = function () {
        if (_db === null)
            return;
        _db.close();
        _db = null;
    };
    return SqliteAccess;
}());
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
function __getRowValues(cursor, returnType) {
    var rowValue = {};
    if (returnType === 1) {
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
                continue;
            case android.database.Cursor.FIELD_TYPE_NULL:
                value = null;
                break;
        }
        if (Array.isArray(rowValue) && returnType === 1) {
            rowValue.push(value);
            continue;
        }
        rowValue[columnName] = value;
    }
    return rowValue;
}
function __openCreateDataBase(dbName, mode) {
    if (dbName === ":memory:") {
        return android.database.sqlite.SQLiteDatabase.create(null);
    }
    var file = __getContext().getDatabasePath(dbName);
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
    var stringArray = [];
    for (var key in params) {
        stringArray.push(params[key] && params[key].toString() || null);
    }
    return stringArray;
}
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
function __getContext() {
    return (app.android.context
        || (app.getNativeApplication && app.getNativeApplication()));
}
function DbBuilder(dbName, options) {
    if (!dbName)
        throw "Must specify a db name";
    options = options || {
        version: 1
    };
    options.version = options.version || 1;
    options.returnType = options.returnType || 0;
    var db = __openCreateDataBase(dbName, android.database.sqlite.SQLiteDatabase.OPEN_READWRITE);
    var curVersion = db.getVersion();
    if (options.version > curVersion) {
        db.setVersion(options.version);
        var tableCreateScripts = options.createTableScriptsFn && options.createTableScriptsFn();
        var tableDroptScripts = options.dropTableScriptsFn && options.dropTableScriptsFn();
        try {
            if (tableDroptScripts) {
                for (var script in tableDroptScripts) {
                    db.execSQL(tableDroptScripts[script]);
                }
            }
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
__export(require("./common/Common"));
//# sourceMappingURL=sqlite-access.android.js.map