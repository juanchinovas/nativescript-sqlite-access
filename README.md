# NativeScript sqlite access

[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![TotalDownloads][total-downloads-image]][npm-url]

[npm-image]:http://img.shields.io/npm/v/nativescript-sqlite-access.svg
[npm-url]:https://npmjs.org/package/nativescript-sqlite-access
[downloads-image]:http://img.shields.io/npm/dm/nativescript-sqlite-access.svg
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

Below all the functions available in the SqliteAccess object.
    
insert values *column/value* in the table and return the last inserted id.
```typescript
insert(tableName:string, values:{[column:string]: any}):number;    
```
replace values *column/value* in the table if primary key exists. Return the number of affected rows
```typescript
replace(tableName:string, values:{[column:string]: any}):number;
```
update values *column/value* in the table to the matched row. Return the number of affected rows
```typescript
update(table: string, values: {[key:string]: any}, whereClause: string, whereArs: Array<any>): number;
```
Delete rows from table that match where clause.
whereClause param must follow the format `column1=? and column2=?`
```typescript
delete(table: string, whereClause?: string, whereArs?: Array<any>): number;
```
Query the table data.
sql param follow the next convention 
"SELECT [COLUMNS,] FROM TABLE WHERE column1=? and column2=?". The where can be omitted.

```typescript
select(sql: string, params?: any[], reduceFn?: Function): Promise<Array<any> | any>;
```
Query table
```typescript
query(table: string, columns?: Array<string>,
    selection?: string, selectionArgs?: Array<any>,
    groupBy?: string, orderBy?: string, limit?: string): Promise<Array<any>>;
```
Execute a sql script and do not return value
```typescript
execSQL(sql: string): void;
```
Start transaction
```typescript
beginTransact(): void;
```
Commit transaction
```typescript
commit(): void;
```
Rollback transaction
```typescript
rollback(): void;
```
Close the sqlite database connection
```typescript
close(): void;
```
