export interface IDatabase {
	/**
	 * Insert a row into table with the values (key = columns and values = columns value)
	 *
	 * @param {string} tableName
	 * @param {{ [key: string]: unknown; }} values
	 *
	 * @returns {number}  id inserted
	 */
	insert(tableName: string, values: { [key: string]: unknown }): number;
	/**
	 * Replace a row values in the table with the values (key = columns and values = columns value).
	 * The table must has a primary column to match with
	 *
	 * @param {string} tableName
	 * @param {{ [key: string]: unknown; }} values
	 *
	 * @returns {number} rows affected
	 */
	replace(tableName: string, values: { [key: string]: unknown }): number;
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
	update(tableName: string, values: { [key: string]: unknown }, whereClause: string, whereArs: Array<unknown>): number;
	/**
	 * Delete rows or a row from the table that matches the condition.
	 *
	 * @param {string} tableName
	 * @param {string} whereClause - optional
	 * @param {Array<unknown>} whereArs - optional
	 *
	 * @returns {number} rows affected
	 */
	delete(tableName: string, whereClause?: string, whereArs?: Array<unknown>): number;
	/**
	 * Query the table data that matches the condition.
	 * @see QueryProcessor for more information.
	 *
	 * @param {string} sql SQL Query. `SELECT [COLUMNS,] FROM TABLE WHERE column1=? and column2=?`. WHERE clause can be omitted
	 * @param {Array<unknown>} conditionParams - optional if there is not WHERE clause in the sql param
	 *
	 * @returns {QueryProcessor} QueryProcessor object that returns a Promise<Array<unknown>>
	 */
	select<T>(sql: string, conditionParams?: Array<unknown>): QueryProcessor<T>;

	/**
	 * Execute a query selector with the params passed in
	 * @see QueryProcessor for more information.
	 *
	 * @param {string} tableName
	 * @param {Array<string>} columns - optional
	 * @param {string} selection - optional
	 * @param {Array<string>} selectionArgs - optional
	 * @param {string} groupBy - optional
	 * @param {string} orderBy - optional
	 * @param {string} limit - optional
	 *
	 * @returns {QueryProcessor} QueryProcessor object that returns a Promise<Array<unknown>>
	 */
	query<T>(param: {
		tableName: string, columns?: Array<string>,
		selection?: string, selectionArgs?: Array<unknown>,
		groupBy?: string, orderBy?: string, limit?: string
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
 * This enum indicate the format data return from database
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
export function parseToJsValue(value: unknown) {
	let parsedValue = value;
	try {
		parsedValue = JSON.parse(value as string);
	} catch { }
	return parsedValue;
}

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
 * Let it add preprocessing function to each row matched by SQL query, each function return a Promise object.
 * The map and reduce functions are similar to the functions apply to an Array,
 * just one preprocessing function is apply to the data per call.
 * The process function is call just if the map or reduce function will not be apply.
 */
export class QueryProcessor<T> {
	private _executorFn: ExecutorType;

	constructor(executorFn: ExecutorType) {
		this._executorFn = executorFn;
	}

	process(transformer?: ReduceCallbackType | MapCallbackType, initialValue?: unknown): Promise<T> {
		const transformerAgent = { transform: transformer, initialValue, type: 0 };
		return new Promise(this._executorFn.bind(null, transformerAgent));
	}

	asGenerator(transformer?: MapCallbackType): Promise<IterableIterator<T>> {
		const transformerAgent = { transform: transformer, type: 1 };
		return new Promise(this._executorFn.bind(null, transformerAgent));
	}
}
type ExecutorType = (
	transformer: TransformerType,
	resolve?: (args: unknown) => void,
	reject?: (err: Error) => void
) => void;
export type MapCallbackType = (row: unknown, index: number) => unknown;
export type ReduceCallbackType = (accumulator: unknown, row: unknown, index: number) => unknown;
export type TransformerType = { transform: ReduceCallbackType | MapCallbackType, initialValue?: unknown, type: number };

export enum FIELD_TYPE {
	NULL = 0,
	INTEGER = 1,
	FLOAT = 2,
	STRING = 3,
	BLOB = 4
}

export function readDbValue(fieldType: FIELD_TYPE, index: number, callback: (colIndex: number, type: FIELD_TYPE) => unknown) {
	return parseToJsValue(
		callback(index, fieldType)
	);
}