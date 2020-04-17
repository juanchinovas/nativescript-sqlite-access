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
tns plugin add nativescript-sqlite-access
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
* Insert a row into table with the values (key = columns and values = columns value)
*
* @param {string} tableName
* @param {{ [key: string]: any; }} values
*
* @returns {number}  id inserted
*/

insert(tableName: string, values: { [key: string]: any }): number;
```
```typescript
/**
* Replace a row values in the table with the values (key = columns and values = columns value).
* The table must has a primary column to match with
*
* @param {string} tableName
* @param {{ [key: string]: any; }} values
*
* @returns {number} rows affected
*/
replace(tableName: string, values: { [key: string]: any }): number;
```
```typescript
/**
* Update a row values in the table with the values (key = columns and values = columns value) to the matched row.
*
* @param {string} tableName
* @param {{ [key: string]: any; }} values
* @param {string} whereClause
* @param {Array<any>} whereArs
*
* @returns {number} rows affected
*/
update(tableName: string, values: { [key: string]: any }, whereClause: string, whereArs: Array<any>): number;
```
```typescript
/**
* Delete rows or a row from the table that matches the condition.
*
* @param {string} tableName
* @param {string} whereClause - optional
* @param {Array<any>} whereArs - optional
*
* @returns {number} rows affected
*/
delete(tableName: string, whereClause?: string, whereArs?: Array<any>): number;
```
```typescript
/**
* Query the table data that matches the condition.
* @see ExtendedPromise for more information.
* 
* @param {string} sql SQL Query. `SELECT [COLUMNS,] FROM TABLE WHERE column1=? and column2=?`. WHERE clause can be omitted
* @param {Array<any>} conditionParams - optional if there is not WHERE clause in the sql param
*
* @returns {ExtendedPromise} ExtendedPromise object that returns a Promise<Array<any>>
*/
select(sql: string, conditionParams?: Array<any>): ExtendedPromise;
```
```typescript
/**
* Execute a query selector with the params passed in
* @see ExtendedPromise for more information.
* 
* @param {string} tableName
* @param {Array<string>} columns - optional
* @param {string} selection - optional
* @param {Array<string>} selectionArgs - optional
* @param {string} groupBy - optional
* @param {string} orderBy - optional
* @param {string} limit - optional
*
* @returns {ExtendedPromise} ExtendedPromise object that returns a Promise<Array<any>>
*/
query(tableName: string, columns?: Array<string>,
    selection?: string, selectionArgs?: Array<any>,
    groupBy?: string, orderBy?: string, limit?: string): ExtendedPromise;
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

> `select` and `query` function return a `ExtendedPromise` in  v1.0.8.
```typescript
/**
 * Let it add preprocessing function to each row matched by SQL query, each function return a Promise object.
 * The map and reduce functions are similar to the functions apply to an Array, 
 * just one preprocessing function is apply to the data per call.
 * The process function is call just if the map or reduce function will not be apply.
 */
class ExtendedPromise {

    map(callback): Promise<any>;

    reduce(callback, initialValue: any): Promise<any>;

    process(): Promise<any>;
}
```

### Changes

v1.0.8
- Fixes the wrong import file in the index file.
- parameter reduceFn was remove from `select` function.
- `select` and `query` function return a `ExtendedPromise` that let you add a map or reduce function to each matched rows.