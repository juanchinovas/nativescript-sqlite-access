import { Application } from "@nativescript/core";
import {
	DbCreationOptions,
	ReturnType,
	IDatabase,
	parseToDbValue,
	QueryProcessor,
	runInitialDbScript,
	readDbValue,
	MapCallback,
	TransformerType,
	ReducerCallback,
	replaceQuestionMark
} from "./sqlite-access.common";

/**
 * This class allow you to connect to sqlite database on Android
 */

class SqliteAccess implements IDatabase {
	/**
	 * Default constructor
	 * @param db android.database.sqlite.SQLiteDatabase
	 * @param returnType ReturnType
	 */
	constructor(private db: android.database.sqlite.SQLiteDatabase, private returnType: ReturnType) { }

	/**
	 * Insert a row into table with the values (key = columns and values = columns value)
	 *
	 * @param {string} tableName
	 * @param {{ [key: string]: unknown; }} values
	 *
	 * @returns {number}  id inserted
	 */
	insert(tableName: string, values: { [key: string]: unknown; }): number {
		return this.db.insert(tableName, null, __mapToContentValues(values));
	}

	/**
	 * Update or Insert a row into table. The table has to have at least one primary key column
	 *
	 * @param {string} tableName
	 * @param {{ [key: string]: unknown; }} values
	 *
	 * @returns {Promise<unknown>}  primary keys affected
	 */
	async upsert(tableName: string, values: { [key: string]: unknown; }): Promise<unknown> {
		const keyColumns = await this.select<Array<string>>(`pragma table_info('${tableName}')`).process(
			(list, item: { [key: string]: unknown; }) => {
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

		return (whereArgs.length === 1 && whereArgs.pop()) ||  whereArgs;
	}

	/**
	 * Replace a row values in the table with the values (key = columns and values = columns value).
	 * The table must has a primary column to match with
	 *
	 * @param {string} tableName
	 * @param {{ [key: string]: unknown; }} values
	 *
	 * @returns {number} replace id
	 */
	replace(tableName: string, values: { [key: string]: unknown; }): number {
		return this.db.replace(tableName, null, __mapToContentValues(values));
	}

	/**
	 * Update a row values in the table with the values (key = columns and values = columns value) to the matched row.
	 *
	 * @param {string} tableName
	 * @param {{ [key: string]: unknown; }} values
	 * @param {string} whereClause
	 * @param {Array<unknown>} whereArs
	 *
	 * @returns {number} rows affected
	 */
	update(tableName: string, values: { [key: string]: unknown; }, whereClause: string, whereArgs: unknown[]): number {
		return this.db.update(tableName, __mapToContentValues(values), replaceQuestionMark(whereClause, whereArgs), null);
	}

	/**
	  * Delete rows or a row from the table that matches the condition.
	  *
	  * @param {string} tableName
	  * @param {string} whereClause - optional
	  * @param {Array<unknown>} whereArs - optional
	  *
	  * @returns {number} rows affected
	  */
	delete(tableName: string, whereClause?: string, whereArgs?: unknown[]): number {
		return this.db.delete(tableName, replaceQuestionMark(whereClause, whereArgs), null);
	}

	/**
	 * Query the table data that matches the condition.
	 * @see QueryProcessor for more information.
	 *
	 * @param {string} sql SQL Query. `SELECT [COLUMNS,] FROM TABLE WHERE column1=? and column2=?`. WHERE clause can be omitted
	 * @param {Array<unknown>} conditionParams - optional if there is not WHERE clause in the sql param
	 *
	 * @returns {QueryProcessor<T>}
	 */
	select<T>(sql: string, params?: unknown[]): QueryProcessor<T> {
		return new QueryProcessor<T>((transformerAgent, resolve, reject) => {
			try {
				const cursor = this.db.rawQuery(replaceQuestionMark(sql, params) || sql,  null);
				if (transformerAgent && transformerAgent.type === 1 /*Generator*/) {
					return resolve(__processCursorReturnGenerator(cursor, this.returnType, transformerAgent));
				}

				resolve(__processCursor(cursor, this.returnType, transformerAgent));
			} catch (ex) {
				reject(ex);
			}
		});
	}

	/**
	 * Execute a query selector with the params passed in
	 * @see QueryProcessor for more information.
	 *
	 * @param {string} param.tableName
	 * @param {Array<string>} param.columns
	 * @param {string} param.selection
	 * @param {Array<unknown>} param.selectionArgs
	 * @param {string} param.groupBy
	 * @param {string} param.having
	 * @param {string} param.orderBy
	 * @param {string} param.limit
	 *
	 * @returns {QueryProcessor} QueryProcessor
	 */
	query<T>(param: { tableName: string, columns?: string[], selection?: string, selectionArgs?: unknown[], groupBy?: string, having?: string, orderBy?: string, limit?: string }): QueryProcessor<T> {
		return new QueryProcessor<T>((transformerAgent, resolve, error) => {
			try {
				const cursor = this.db.query(
					param.tableName,
					param.columns,
					replaceQuestionMark(param.selection, param.selectionArgs), null,
					param.groupBy,
					param.having,
					param.orderBy,
					param.limit);

				if (transformerAgent && transformerAgent.type === 1 /*Generator*/) {
					return resolve(__processCursorReturnGenerator(cursor, this.returnType, transformerAgent));
				}

				resolve(__processCursor(cursor, this.returnType, transformerAgent));
			} catch (ex) {
				error(ex);
			}
		});
	}

	/**
	 * Execute a SQL script and do not return anything
	 * @param sql
	 */
	execSQL(sql: string) {
		this.db.execSQL(sql);
	}

	/**
	 * Open a transaction
	 */
	beginTransact() {
		this.db.beginTransaction();
	}

	/**
	 * Commit the transaction
	 */
	commit() {
		this.db.setTransactionSuccessful();
		this.db.endTransaction();
	}

	/**
	 * Rollback a transaction
	 */
	rollback() {
		this.db.endTransaction();
	}

	/**
	 * Close the database connection
	 */
	close(): void {
		if (this.isClose()) { // already closed
			return;
		}

		this.db.close();
		this.db = null;
	}

	isClose(): boolean {
		return this.db === null;
	}
}

/** private function
 * Function to loop android.database.Cursor
 * @param {android.database.Cursor} cursor
 * @param {ReturnType} returnType
 *
 * @returns Array<unknown> | unknown;
 */
function __processCursor(cursor: android.database.Cursor, returnType: ReturnType, transformerAgent?: TransformerType<unknown>) {
	let result: Array<unknown> | unknown = (transformerAgent && transformerAgent.initialValue) || [];
	if (cursor.getCount() > 0) {
		let dbValue = null;
		while (cursor.moveToNext()) {
			dbValue = __getRowValues(cursor, returnType);
			if (transformerAgent && transformerAgent.transform) {
				if (transformerAgent.initialValue) {
					result = (transformerAgent.transform as ReducerCallback<unknown>)(result, dbValue, cursor.getPosition());
					continue;
				}
				dbValue = (transformerAgent.transform as MapCallback<unknown>)(dbValue, cursor.getPosition());
			}
			(<Array<unknown>>result).push(dbValue);
		}
	}
	cursor.close();

	return result;
}

/**
 * Process each row
 * @generator
 * @function __processCursorGenerator
 * @yields {unknown} row
 * @param {android.database.Cursor} cursor 
 * @param {ReturnType} returnType 
 * @param {TransformerType} transformerAgent 
 */
function* __processCursorReturnGenerator(cursor: android.database.Cursor, returnType: ReturnType, transformerAgent?: TransformerType<unknown>) {
	if (cursor.getCount() > 0) {
		while (cursor.moveToNext()) {
			const row = __getRowValues(cursor, returnType);
			if (transformerAgent && transformerAgent.transform) {
				yield (transformerAgent.transform as MapCallback<unknown>)(row, cursor.getPosition()); continue;
			}
			yield row;
		}
	}
	cursor.close();
}

/** private function
 * Process the sqlite cursor and return a
 * js object with column/value or an array row
 *
 * @param {android.database.Cursor} cursor
 * @param {ReturnType} returnType
 * @returns {Array<unknown> | Record<string, unknown>}
 */
function __getRowValues(cursor: android.database.Cursor, returnType: ReturnType): Array<unknown> | Record<string, unknown> {
	const rowValue: Array<unknown> | Record<string, unknown> = returnType === ReturnType.AS_ARRAY ? [] : {};
	const columnCount: number = cursor.getColumnCount();
	const fn = (col: number) => cursor.getString(col);

	for (let i = 0; i < columnCount; i++) {
		const value = readDbValue(cursor.getType(i), i, fn);

		// If result wanted as array of array
		if (returnType === ReturnType.AS_ARRAY) {
			(rowValue as Array<unknown>).push(value);
			continue;
		}

		rowValue[cursor.getColumnName(i)] = value;
	}

	return rowValue;
}

/** private function
 * open or create a read-write database, permanently or in memory
 * @param {string} dbName database name
 * @param {number} mode openness mode
 * @returns android.database.sqlite.SQLiteDatabase
 */
function __openCreateDataBase(dbName: string, mode: number): android.database.sqlite.SQLiteDatabase {
	if (dbName === ":memory:") {
		return android.database.sqlite.SQLiteDatabase.create(null);
	}
	// Getting a native File object
	const file: java.io.File = <java.io.File>__getContext().getDatabasePath(dbName);
	// Check if database file does not exist, then create dir
	if (!file.exists()) {
		file.getParentFile().mkdirs();
		file.getParentFile().setReadable(true);
		file.getParentFile().setWritable(true);
	}

	mode = mode | android.database.sqlite.SQLiteDatabase.CREATE_IF_NECESSARY;
	return android.database.sqlite.SQLiteDatabase.openDatabase(file.getAbsolutePath(), null, mode);
}

/**
 * Map a key/value JS object to android.content.ContentValues
 * @param { unknown } values.key
 * @returns {android.content.ContentValues}
 */
function __mapToContentValues(values: { [key: string]: unknown; }): android.content.ContentValues {
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

/** private function
 * Get and return Android app Context
 */
function __getContext() {
	return (Application.android.context
		|| (Application.getNativeApplication && Application.getNativeApplication()));
}

/**
 * Create an instance of android.database.sqlite.SQLiteDatabase, execute the dropping and creating tables scripts if exists
 * and if the version number is greater the database version
 * @param {string} dbName
 * @param {DbCreationOptions} options
 * @returns {SqliteAccess}
 *
 * @throws
 * if database version < the user version
 * if no database name
 * if dropping table scripts error
 * if creating table scripts error
 */
export function DbBuilder(dbName: string, options?: DbCreationOptions): SqliteAccess {
	if (!dbName) throw new Error("Must specify a db name");

	// Make sure version be 1 or greater and returnType AS_OBJECT
	options = Object.assign({
		version: 1,
		returnType: ReturnType.AS_OBJECT
	}, options);

	const db = __openCreateDataBase(dbName, android.database.sqlite.SQLiteDatabase.OPEN_READWRITE);
	const curVersion = db.getVersion();

	try {
		if (options.version !== curVersion) {
			db.setVersion(options.version);
			runInitialDbScript(curVersion, options, (script) => db.execSQL(script));
		}
	} catch (error) {
		db.setVersion(curVersion);
		db.close();
		throw error;
	}

	return new SqliteAccess(db, options.returnType);
}

/**
 * Export ReturnType and DbCreationOptions
 */
export * from "./sqlite-access.common";