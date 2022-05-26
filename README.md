# NativeScript sqlite access

[![NPM version][npm-image]][npm-url]
[![TotalDownloads][total-downloads-image]][npm-url]

[npm-image]:http://img.shields.io/npm/v/nativescript-sqlite-access.svg
[npm-url]:https://npmjs.org/package/nativescript-sqlite-access
[total-downloads-image]:http://img.shields.io/npm/dt/nativescript-sqlite-access.svg?label=total%20downloads

Just a NativeScript plugin to access and manage data with sqlite on ![apple](https://cdn3.iconfinder.com/data/icons/picons-social/57/16-apple-32.png) ![android](https://cdn4.iconfinder.com/data/icons/logos-3/228/android-32.png). 

## Installation

Run the following command from the root of your project:

```bash
tns plugin add nativescript-sqlite-access@1.0.81
```
`@nativescript/core?`

```bash
tns plugin add nativescript-sqlite-access@1.2.0
```
The command above automatically installs the necessary files, as well as stores nativescript-sqlite-access as a dependency in your project's package.json file.

## Usage 

You need to import function DbBuilder to create a instance of SqliteAccess class and access to the API of the plugin to manage your app's data.
	
```typescript
import { DbBuilder } from 'nativescript-sqlite-access';

export class HomeViewModel {
    private db;
    constructor() {
        super();
        // Creating SqliteAccess class instance
        // Passing the name of the database file
        this.db = DbBuilder("<database_file_name>");
    }
}
```

The function DbBuilder receive two parameters the database file name and an optional [**DbCreationOptions**](src/sqlite-access-common.ts#DbCreationOptions) object. If you do not pass the last parameter, a default one will be created, but you cannot set the db version.

See the full example below in typescript

```typescript
import {DbBuilder, IDatabase, DbCreationOptions, ReturnType} from 'nativescript-sqlite-access';

export class HomeViewModel {
    private db: IDatabase;
    constructor() {
        super();
        this.db = DbBuilder("test.db", <DbCreationOptions>{
            version: 1, //Version of the database
            /*All tables needed*/
            createTableScriptsFn: ()=> {
                return ['CREATE TABLE if not exists table_name(_id INTEGER PRIMARY KEY AUTOINCREMENT, column TEXT)'];
            },
            /*Drop tables scripts, needed if your will change the tables structure*/
            dropTableScriptsFn:()=> { 
                return ['DROP TABLE IF EXISTS table_name']
            },
            returnType: ReturnType.AS_OBJECT /*(DEFAULT) | ReturnType.AS_ARRAY*/
        });
    }
}
```

**createTableScriptsFn** and **dropTableScriptsFn** will be executed when database is created or database version is changed to a higher value. Those functions must return an array of string with all the scripts to create or delete the tables used in your app. In case you change a table structure you must change the database version to apply the changes.

### `DbCreationOptions'` properties

| Property | Type | Description |
| --- | --- | --- |
|version|`number`| Database version |
|createTableScriptsFn|`function`| Function that return a `Array` of string with the sql query to create the app's tables |
|dropTableScriptsFn|`function`| Function that return a `Array` of string with the sql query to drop the app's tables |
|returnType|`enum`| Indicate the type object returned by the plugin. Possible values `ReturnType.AS_OBJECT` and `ReturnType.AS_ARRAY` |

## API
```typescript
/**
 * Insert row into table with the values (key = columns and values = columns value)
 *
 * @param {string} tableName
 * @param {{ [key: string]: unknown; }} values
 *
 * @returns {number}  id inserted
 */
insert(tableName: string, values: { [key: string]: unknown }): number;
```
```typescript
/**
 * Update or Insert a row into table. The table has to have at least one primary key column
 *
 * @param {string} tableName
 * @param {{ [key: string]: unknown; }} values
 *
 * @returns {Promise<unknown>}  primary keys affected
 */
upsert(tableName: string, values: { [key: string]: unknown; }): Promise<unknown>;
```
```typescript
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
```
```typescript
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
```
```typescript
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
```
```typescript
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
```
```typescript
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
```
```typescript
/**
* Execute a SQL script and do not return anything
* @param {string} sql
*/
execSQL(sql: string): void;
```
```typescript
/**
* Open a transaction
*/
beginTransact(): void;
```
```typescript
/**
* Commit the transaction
*/
commit(): void;
```
```typescript
/**
* Rollback a transaction
*/
rollback(): void;
```
```typescript
/**
* Close the database connection
*/
close(): void;
```

> `select` and `query` function returns a `QueryProcessor` in  v1.1.0
```typescript
/**
 * Let you add preprocessing function to each matched row by SQL query.
 * The map and reduce functions are similar to the functions apply to an Array,
 */
export declare class QueryProcessor<T> {
    process<R>(transformer?: ReducerCallback<R>, initialValue?: R): Promise<T>;
	process<R>(transformer?: MapCallback<R>): Promise<T>;
    asGenerator(transformer?: MapCallback): Promise<IterableIterator<T>>;
}
export type MapCallback<R> = (row: unknown, index: number) => R;
export type ReducerCallback<R> = ((accumulator: R, row: unknown, index: number) => R);
```

### Changes

v1.1.0 `!!Braking changes`
- `ExtendedPromise` renamed to `QueryProcessor<T>`
- `map` and `reduce` functions were removed from `QueryProcessor<T>`.
- `asGenerator` NEW function on `QueryProcessor<T>` allow you to read rows one by one from the db and pass in a row transformer function
- `process` function allow you to `*transform*` or `*reduce*` the result.
- Android and iOS minor fixes.