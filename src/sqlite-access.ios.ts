import { knownFolders } from "@nativescript/core/file-system";
import {
	DbCreationOptions,
	ReturnType,
	IDatabase,
	parseToDbValue,
	QueryProcessor,
	runInitialDbScript,
	readDbValue,
	TransformerType,
	ReduceCallback,
	MapCallback,
	replaceQuestionMark
} from "./sqlite-access.common";

/**
 * This class allow you to connect to sqlite database on iOS
 */

class SqliteAccess implements IDatabase {

	/**
	 * Default constructor
	 * @param db interop.Reference<interop.Pointer>
	 * @param returnType ReturnType
	 */
	constructor(private db: interop.Reference<interop.Pointer>, private returnType: ReturnType) { }

	/**
	 * Insert a row into table with the values (key = columns and values = columns value)
	 *
	 * @param {string} tableName
	 * @param {{ [key: string]: unknown; }} values
	 *
	 * @returns {number}  id inserted
	 */
	insert(tableName: string, values: { [key: string]: unknown; }): number {
		this.execSQL(`INSERT INTO ${tableName} (${Object.keys(values).join(",")}) VALUES(${__mapToAddOrUpdateValues(values, true)})`);
		return sqlite3_last_insert_rowid(this.db.value);
	}

	/**
	 * Replace a row values in the table with the values (key = columns and values = columns value).
	 * The table must has a primary column to match with
	 *
	 * @param {string} tableName
	 * @param {{ [key: string]: unknown; }} values
	 *
	 * @returns {number} rows affected
	 */
	replace(tableName: string, values: { [key: string]: unknown; }): number {
		this.execSQL(`REPLACE INTO ${tableName} (${Object.keys(values).join(",")}) VALUES(${__mapToAddOrUpdateValues(values, true)})`);
		return sqlite3_last_insert_rowid(this.db.value);
	}

	/**
	 * Update a row values in the table with the values (key = columns and values = columns value) to the matched row.
	 *
	 * @param {string} tableName
	 * @param {{ [key: string]: unknown; }} values
	 * @param {string} whereClause
	 * @param {Array<unknown>} whereArgs
	 *
	 * @returns {number} rows affected
	 */
	update(tableName: string, values: { [key: string]: unknown; }, whereClause: string, whereArgs: unknown[]): number {
		const condition = replaceQuestionMark(whereClause, whereArgs);
		whereClause = (condition && "WHERE " + condition) || "";
		this.execSQL(`UPDATE ${tableName} SET ${__mapToAddOrUpdateValues(values, false)} ${whereClause}`);
		return sqlite3_changes(this.db.value);
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
		const condition = replaceQuestionMark(whereClause, whereArgs);
		whereClause = (condition && "WHERE " + condition) || "";
		this.execSQL(`DELETE FROM ${tableName} ${whereClause}`);
		return sqlite3_changes(this.db.value);
	}

	/**
	 * Query the table data that matches the condition.
	 * @see QueryProcessor for more information.
	 *
	 * @param {string} sql SQL Query. `SELECT [COLUMNS,] FROM TABLE WHERE column1=? and column2=?`. WHERE clause can be omitted
	 * @param {Array<unknown>} conditionParams - optional where params if there is not WHERE clause in the sql param
	 *
	 * @returns {QueryProcessor<T>}
	 */
	select<T>(sql: string, conditionParams?: unknown[]): QueryProcessor<T> {
		return new QueryProcessor<T>((transformerAgent, resolve, error) => {
			try {
				sql = replaceQuestionMark(sql, conditionParams);
				const cursor = __execQueryAndReturnStatement(sql, this.db);
				if (transformerAgent && transformerAgent.type === 1 /*Generator*/) {
					return resolve(__processCursorGenerator(cursor, this.returnType, transformerAgent));
				}

				resolve(__processCursor(cursor, this.returnType, transformerAgent));
			} catch (ex) {
				error(ex);
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
	 * @returns {QueryProcessor<T>}
	 */
	query<T>(param: { tableName: string, columns?: string[], selection?: string, selectionArgs?: unknown[], groupBy?: string, having?: string, orderBy?: string, limit?: string }): QueryProcessor<T> {
		return new QueryProcessor<T>((transformerAgent, resolve, error) => {
			try {
				const cursor = __execQueryAndReturnStatement(__assembleScript(param), this.db);
				if (transformerAgent && transformerAgent.type === 1 /*Generator*/) {
					return resolve(__processCursorGenerator(cursor, this.returnType, transformerAgent));
				}

				resolve(
					__processCursor(cursor, this.returnType, transformerAgent)
				);
			} catch (ex) {
				error(ex);
			}
		});
	}
	/**
	 * Execute a SQL script and do not return anything
	 * @param {string} sql
	 */
	execSQL(sql: string) {
		const cursorRef: interop.Pointer = __execQueryAndReturnStatement(sql, this.db);
		sqlite3_finalize(cursorRef);
	}

	/**
	 * Open a transaction
	 */
	beginTransact() {
		this.execSQL("BEGIN TRANSACTION");
	}

	/**
	 * Commit the transaction
	 */
	commit() {
		this.execSQL("COMMIT TRANSACTION");
	}

	/**
	 * Rollback a transaction
	 */
	rollback() {
		this.execSQL("ROLLBACK TRANSACTION");
	}

	/**
	 * Close the database connection
	 */
	close(): void {
		if (this.isClose()) {
			return;
		}

		sqlite3_close(this.db.value);
		this.db = null;
	}

	isClose(): boolean {
		return this.db === null;
	}
}

/** private function
 * Execute a sql script and return the sqlite3 statement object
 * @param sql string
 * @param dbPointer interop.Reference<unknown>
 *
 * @returns sqlite3 statement object stepped
 *
 * @throws
 * if sqlite3_prepare_v2 returns !== 0
 * if sqlite3_step !== 101
 */
function __execQueryAndReturnStatement(sql: string, dbPointer: interop.Reference<interop.Pointer>): interop.Pointer {
	let cursorRef = new interop.Reference<interop.Pointer>();
	const resultCode = sqlite3_prepare_v2(dbPointer.value, sql, -1, cursorRef, null);
	const applyStatementCode = sqlite3_step(cursorRef.value);
	if (resultCode !== 0 /*SQLITE_OK*/ || (applyStatementCode !== 101 /*SQLITE_DONE*/ && applyStatementCode !== 100 /*SQLITE_ROW*/)) {
		sqlite3_finalize(cursorRef.value);
		cursorRef.value = null;
		cursorRef = null;

		throw new Error(NSString.stringWithUTF8String(sqlite3_errmsg(dbPointer.value)).toString());
	}
	return cursorRef.value;
}

/**
 * Generate SELECT query
 * @param {string} param.tableName
 * @param {Array<string>} param.columns
 * @param {string} param.selection
 * @param {Array<unknown>} param.selectionArgs
 * @param {string} param.groupBy
 * @param {string} param.orderBy
 * @param {string} param.limit
 * 
 * @returns string
 */
function __assembleScript(param: { tableName: string, columns?: string[], selection?: string, selectionArgs?: unknown[], groupBy?: string, orderBy?: string, having?: string, limit?: string }) {
	const condition = replaceQuestionMark(param.selection, param.selectionArgs);
	param.selection = (condition && "WHERE " + condition) || "";
	param.groupBy = (param.groupBy && "GROUP BY " + param.groupBy) || "";
	param.having = (param.having && "HAVING " + param.having) || "";
	param.orderBy = (param.orderBy && "ORDER BY " + param.orderBy) || "";
	param.limit = (param.limit && "LIMIT " + param.limit) || "";
	const _columns = (param.columns && param.columns.join(",")) || `${param.tableName}.*`;

	return `SELECT ${_columns} FROM ${param.tableName} ${param.selection} ${param.groupBy} ${param.having} ${param.orderBy} ${param.limit}`;
}

/**
 * Read dataset
 * @param {interop.Pointer} cursorRef 
 * @param {ReturnType} returnType 
 * @param {TransformerType} transformerAgent  
 * @returns Array<unknown> | unknown
 */
function __processCursor(cursorRef: interop.Pointer, returnType: ReturnType, transformerAgent?: TransformerType) {
	let result: Array<unknown> | unknown = (transformerAgent && transformerAgent.initialValue) || [];
	let dbRow = null;

	if (sqlite3_data_count(cursorRef) > 0) {
		let counter = 0;
		do {
			dbRow = __getRowValues(cursorRef, returnType);
			if (transformerAgent && transformerAgent.transform) {
				if (transformerAgent.initialValue) {
					result = (transformerAgent.transform as ReduceCallback)(result, dbRow, counter++);
					continue;
				}
				dbRow = (transformerAgent.transform as MapCallback)(dbRow, counter++);
			}
			(<Array<unknown>>result).push(dbRow);
			// Condition on the while fixes issue #8
		} while (sqlite3_step(cursorRef) === 100 /*SQLITE_ROW*/);
	}

	sqlite3_finalize(cursorRef);
	return result;
}

/**
 * Process each row
 * @generator
 * @function __processCursorGenerator
 * @yields {unknown} row
 * 
 * @param {interop.Pointer} cursorRef 
 * @param {ReturnType} returnType 
 * @param {TransformerType} transformerAgent 
 */
function* __processCursorGenerator(cursorRef: interop.Pointer, returnType: ReturnType, transformerAgent?: TransformerType) {
	if (sqlite3_data_count(cursorRef) > 0) {
		let counter = 0;
		do {
			const row = __getRowValues(cursorRef, returnType);
			if (transformerAgent && transformerAgent.transform) {
				yield (transformerAgent.transform as MapCallback)(row, counter++);
				continue;
			}
			yield row;
			// Condition on the while fixes issue #8
		} while (sqlite3_step(cursorRef) === 100 /*SQLITE_ROW*/);
	}

	sqlite3_finalize(cursorRef);
}

/** private function
 * Process the sqlite cursor and return a
 * js object with column/value or an array row
 *
 * @param {interop.Reference<unknown>} cursor
 * @param {ReturnType} returnType
 * @returns {Array<unknown> | Record<string, unknown>}
 */
function __getRowValues(cursor: interop.Pointer, returnType: ReturnType): Array<unknown> | Record<string, unknown> {

	const rowValue: Array<unknown> | Record<string, unknown> = returnType === ReturnType.AS_ARRAY ? [] : {};
	const columnCount: number = sqlite3_column_count(cursor);
	const fn = (col: number) => NSString.stringWithUTF8String(sqlite3_column_text(cursor, col) || "").toString();

	for (let i = 0; i < columnCount; i++) {
		const value = readDbValue(sqlite3_column_type(cursor, i), i, fn);

		// If result wanted as array of array
		if (returnType === ReturnType.AS_ARRAY) {
			(rowValue as Array<unknown>).push(value);
			continue;
		}

		let columnName = sqlite3_column_name(cursor, i);
		columnName = NSString.stringWithUTF8String(columnName).toString();
		rowValue[columnName] = value;
	}

	return rowValue;
}

/** private function
 * open or create a read-write database, permanently or in memory
 * @param {string} dbName database name
 * @param {number} mode openness mode
 *
 * @returns interop.Reference<interop.Pointer> sqlite3*
 *
 * @throws
 * if sqlite3_open_v2 returned code !== 0
 */
function __openOrCreateDataBase(dbName: string, mode: number) {
	const dbInstance = new interop.Reference<interop.Pointer>();
	let resultCode = 0;
	if (dbName === ":memory:") {
		resultCode = sqlite3_open_v2(dbName, dbInstance, mode | 296 /*SQLITE_OPEN_MEMORY*/, null);
	} else {
		const dbDir = `${knownFolders.documents().path}/${dbName}`;
		mode = mode | 4 /*SQLITE_OPEN_CREATE*/;

		resultCode = sqlite3_open_v2(dbDir, dbInstance, mode, null);
	}

	if (resultCode !== 0 /*SQLITE_OK*/) {
		throw new Error(`Could not open database. sqlite error code ${resultCode}`);
	}

	return dbInstance;
}

/**
 * Map a key/value JS object to Array<string>
 * @param { unknown } values.key
 * @param {boolean} inserting
 *
 * @returns string
 */
function __mapToAddOrUpdateValues(values: { [key: string]: unknown; }, inserting: boolean) {
	const contentValues = [];
	for (const key in values) {
		if (Object.prototype.hasOwnProperty.call(values, key)) {
			const value = parseToDbValue(values[key]);
			contentValues.push(inserting ? value : `${key}=${value}`);
		}
	}
	return contentValues.join(",");
}

/**
 * Get or set the database user_version
 * @param db sqlite3*
 * @param version number
 *
 * @returns number|undefined
 */
function __dbVersion(db: interop.Reference<interop.Pointer>, version?: number) {
	const sql = "PRAGMA user_version";

	if (isNaN(version)) {
		version = __execQueryReturnOneArrayRow(db, sql).pop() as number;
	} else {
		const cursorRef = __execQueryAndReturnStatement(`${sql}=${version}`, db);
		sqlite3_finalize(cursorRef);
	}
	return version;
}

/**
 * Execute a sql query and return the first row
 * @param {nterop.Reference<interop.Pointer>} db
 * @param {string} query
 *
 * @return Array<unknown>
 */
function __execQueryReturnOneArrayRow(db: interop.Reference<interop.Pointer>, query: string): Array<unknown> {
	const cursorRef = __execQueryAndReturnStatement(query, db);
	const result = <Array<Array<unknown>>>__processCursor(cursorRef, ReturnType.AS_ARRAY);
	return result.shift();
}

/**
 * Create an instance of sqlite3*, execute the dropping and creating tables scripts if exists
 * and if the version number is greater the database version
 * @param {String} dbName
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

	// Ensure version be 1 or greater and returnType AS_OBJECT
	options = Object.assign({
		version: 1,
		returnType: ReturnType.AS_OBJECT
	}, options);

	const db = __openOrCreateDataBase(dbName, 2/*SQLITE_OPEN_READWRITE*/);
	const currVersion = __dbVersion(db);

	try {
		if (options.version !== currVersion) {
			__dbVersion(db, options.version);
			runInitialDbScript(currVersion, options, (script) => {
				const cursorRef = __execQueryAndReturnStatement(script, db);
				sqlite3_finalize(cursorRef);
			});
		}
	} catch (error) {
		__dbVersion(db, currVersion);
		sqlite3_close(db);
		throw error;
	}

	return new SqliteAccess(db, options.returnType);
}

/**
 * Export ReturnType and DbCreationOptions
 */
export * from "./sqlite-access.common";