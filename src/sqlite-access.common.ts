export interface IDatabase {
	/**
	 * Insert row into table with the values (key = columns and values = columns value)
	 *
	 * @param {string} tableName
	 * @param {{ [key: string]: unknown; }} values
	 *
	 * @returns {number}  id inserted
	 */
	insert(tableName: string, values: { [key: string]: unknown }): number;
	/**
	 * Update or Insert a row into table. The table has to have at least one primary key column
	 *
	 * @param {string} tableName
	 * @param {{ [key: string]: unknown; }} values
	 *
	 * @returns {Promise<unknown>}  primary keys affected
	 */
	upsert(tableName: string, values: { [key: string]: unknown; }): Promise<unknown>;
	/**
	 * Replace row values in the table with the values (key = columns and values = columns value).
	 * The table must has a primary column to match with
	 *
	 * @param {string} tableName
	 * @param {{ [key: string]: unknown; }} values
	 *
	 * @returns {number} affected rows
	 */
	replace(tableName: string, values: { [key: string]: unknown }): number;
	/**
	 * Update row values in the table with the values (key = columns and values = columns value) to the matched row.
	 *
	 * @param {string} tableName
	 * @param {{ [key: string]: unknown; }} values
	 * @param {string} whereClause
	 * @param {Array<unknown>} whereArs
	 *
	 * @returns {number} affected rows
	 */
	update(tableName: string, values: { [key: string]: unknown }, whereClause: string, whereArs: Array<unknown>): number;
	/**
	 * Delete rows or a row from the table that matches the condition.
	 *
	 * @param {string} tableName
	 * @param {string} whereClause
	 * @param {Array<unknown>} whereArs
	 *
	 * @returns {number} affected rows
	 */
	delete(tableName: string, whereClause?: string, whereArs?: Array<unknown>): number;
	/**
	 * Execute a query, return QueryProcessor.
	 * @see QueryProcessor for more information.
	 *
	 * @param {string} sql SQL Query. `SELECT [COLUMNS,] FROM TABLE WHERE column1=? and column2=?`. WHERE clause can be omitted
	 * @param {Array<unknown>} conditionParams - optional if there is not WHERE clause in the sql param
	 *
	 * @returns {QueryProcessor<T>}
	 */
	select<T>(sql: string, conditionParams?: Array<unknown>): QueryProcessor<T>;

	/**
	 * Query the given table, return QueryProcessor
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
	query<T>(param: {
		tableName: string, columns?: Array<string>,
		selection?: string, selectionArgs?: Array<unknown>,
		groupBy?: string, having?: string, orderBy?: string, limit?: string
	}): QueryProcessor<T>;

	/**
	 * Execute a SQL script and do not return anything
	 * @param {string} sql
	 */
	execSQL(sql: string): void;

	/**
	 * Open a transaction
	 */
	beginTransact(): void;
	/**
	 * Commit the transaction
	 */
	commit(): void;
	/**
	 * Rollback a transaction
	 */
	rollback(): void;

	/**
	 * Close the database connection
	 */
	close(): void;
	/**
	 * Determine database connection is closed
	 * @returns {boolean}
	 */
	isClose(): boolean;
}

/**
 * This enum indicate the data format that might be return
 * @enum {number}
 */
export const enum ReturnType {
	AS_OBJECT,
	AS_ARRAY
}

/**
 * This is a configuration interface to indicate the tables,
 * version and the return type of data from database
 */
export interface DbCreationOptions {
	version?: number;
	createTableScriptsFn?: () => Array<string>;
	dropTableScriptsFn?: () => Array<string>;
	returnType?: ReturnType;
}

/**
 * Parse value to database
 * @param {unknown} value
 */
export function parseToDbValue(value: unknown) {
	if (value === 0) return value;
	if (value === "") return "''";
	if (value && value instanceof Function) return null;

	if ((value && typeof value === "object" && value.constructor === Object) ||
		(value && typeof value === "object" && value.constructor === Array) ||
		(value && typeof value === "object" && value.constructor.constructor === Function)) {
		value = JSON.stringify(value);
	}
	// Fixes issue #7
	return Number(value) || ((value && `'${value.toString().replace(/'/g, "''")}'`) || null);
}

/**
 * Parse value to JS
 * @param {unknown} value
 */
export function parseToJsValue(value: unknown): unknown {
	try {
		return JSON.parse(value as string);
	} catch { }
	return value;
}

/**
 * Run when the database is first created and when db version change
 * @param {number} currDbVersion
 * @param {DbCreationOptions} options
 * @param {(script: string) => void} callback
 * 
 * @throws Error when new db version is less than current db version
 * 
 * @returns void
 */
export function runInitialDbScript(
	currDbVersion: number,
	options: DbCreationOptions,
	callback: (script: string) => void
) {
	if (options.version < currDbVersion) {
		throw new Error(
			`It is not possible to set the version ${options.version} to database, because is lower then current version, Db current version is
            ${currDbVersion}`
		);
	}

	// Dropping all tables
	const tableDroptScripts = options.dropTableScriptsFn && options.dropTableScriptsFn();
	if (tableDroptScripts && currDbVersion > 0) {
		tableDroptScripts.forEach(callback);
	}

	// Creating all tables
	const tableCreateScripts = options.createTableScriptsFn && options.createTableScriptsFn();
	if (tableCreateScripts) {
		tableCreateScripts.forEach(callback);
	}
}


/**
 * Let you add preprocessing function to each matched row by SQL query.
 * The map and reduce functions are similar to the functions apply to an Array,
 */
export class QueryProcessor<T> {
	private _executorFn: ExecutorType;

	constructor(executorFn: ExecutorType) {
		this._executorFn = executorFn;
	}

	/**
	 * Execute the SQL query, calls transformer function on each matched row if any
	 * @param {ReducerCallback | MapCallback} transformer
	 * @param {unknown} initialValue  optional
	 * @returns Promise<T>
	 */
	process<R>(transformer?: ReducerCallback<R>, initialValue?: R): Promise<T>;
	process<R>(transformer?: MapCallback<R>): Promise<T>;
	process<R>(transformer?: ReducerCallback<R> | MapCallback<R>, initialValue?: R): Promise<T> {
		const transformerAgent = { transform: transformer, initialValue, type: 0 };
		return new Promise<T>(this._executorFn.bind(null, transformerAgent));
	}

	/**
	 * Execute the SQL query, calls transformer function on each matched row if any, return IterableIterator
	 * @param {MapCallback} transformer 
	 * @returns Promise<IterableIterator<T>>
	 */
	asGenerator<R>(transformer?: MapCallback<R>): Promise<IterableIterator<T>> {
		const transformerAgent = { transform: transformer, type: 1 };
		return new Promise<IterableIterator<T>>(this._executorFn.bind(null, transformerAgent));
	}
}

type ExecutorType = (
	transformer: TransformerType<unknown>,
	resolve?: (args: unknown) => void,
	reject?: (err: Error) => void
) => void;

export type MapCallback<R> = (row: unknown, index: number) => R;
export type ReducerCallback<R> = ((accumulator: R, row: unknown, index: number) => R);
export type TransformerType<R> = { transform: ReducerCallback<R> | MapCallback<R>, initialValue?: R, type: number };

export enum FIELD_TYPE {
	NULL_ANDROID = 0,
	NULL_SQLITE = 5,
	INTEGER = 1,
	FLOAT = 2,
	STRING = 3,
	BLOB = 4
}

/**
 * Parse db column value, return string | number | Array | Object
 * @param {FIELD_TYPE} fieldType 
 * @param {number} index 
 * @param {(colIndex: number, type: FIELD_TYPE) => unknown} callback 
 * @returns unknown
 */
export function readDbValue(fieldType: FIELD_TYPE, index: number, callback: (colIndex: number, type: FIELD_TYPE) => unknown) {
	if (FIELD_TYPE[fieldType].includes("NULL")) return null;
	return parseToJsValue(
		callback(index, fieldType)
	);
}

/**
 * Replace the question mark in the query ith the values
 *
 * @param {string} target
 * @param {Array<unknown>} values
 * @returns string
 */
export function replaceQuestionMark(target: string, values: Array<unknown>): string {
	if (!target) return null;
	if (!values) return target;

	let counter = 0;
	return target.replace(/\?/g, () => {
		const param = values[counter++];
		if (Array.isArray(param)) {
			return (param as Array<unknown>).join();
		}

		return parseToDbValue(param) as string;
	});
}