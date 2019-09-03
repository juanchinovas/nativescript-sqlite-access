# NativeScript sqlite access

Just a NativeScript plugin to access and manage data with sqlite on ![apple](https://cdn3.iconfinder.com/data/icons/picons-social/57/16-apple-32.png) &amp;  ![android](https://cdn4.iconfinder.com/data/icons/logos-3/228/android-32.png). 

## Installation

Run the following command from the root of your project:

```bash
tns plugin add nativescript-sqlite-access
```
The command above automatically installs the necessary files, as well as stores nativescript-sqlite-access as a dependency in your project's package.json file.

## Usage 

You need to import de function DbBuilder to create a instance of SqliteAccess class and can access to the API to manage your app's data.
	
```typescript
import { DbBuilder } from 'nativescript-sqlite-access';

export class HomeViewModel {
    private db;
    constructor() {
        super();
        //Creating SqliteAccess class instance
        //Passing the name of the database file
        this.db = DbBuilder("<database_file_name>");
    }
}
```

The function DbBuilder receive to parameters the name of the database file name and an optional [**DbCreationOptions**](src/common/Common.ts#DbCreationOptions) object. If you do not pass the last parameter, a default one will be created, but you cannot set the db version.

See the full example below on typescript

```typescript
import {DbBuilder, IDatabase, DbCreationOptions, ReturnType} from 'nativescript-sqlite-access';

export class HomeViewModel {
    private db: IDatabase; //The SqliteAccess' parent
    constructor() {
        super();
        this.db = DbBuilder("test.db", <DbCreationOptions>{
            version: 1,
            /*All tables needed*/
            createTableScriptsFn: ()=> {
                return ['CREATE TABLE if not exists table_name(_id INTEGER PRIMARY KEY AUTOINCREMENT, column TEXT)'];
            },
            /*Drop tables scripts, needed if your will change the tables structure*/
            dropTableScriptsFn:()=> { 
                return ['DROP TABLE IF EXISTS table_name']
            }
        });
    }
}
```

**createTableScriptsFn** and **dropTableScriptsFn** will be executed when database is created and database version is changed to a higher value. 

## API

    
|API description|
|---|
```typescript
insert(tableName:string, values:{[column:string]: any}):number;

insert values /*column/value*/ in the table and return the last inserted id
    
```
```typescript
replace(tableName:string, values:{[column:string]: any}):number;

replace values /*column/value*/ in the table if primary key exists. Return the number of affected rows
```
```typescript
update(table: string, values: {[key:string]: any}, whereClause: string, whereArs: Array<any>): number;

update values /*column/value*/ in the table to the matched row. Return the number of affected rows
```
```typescript
delete(table: string, whereClause: string, whereArs: Array<any>): number;

Delete rows from table that match where clause.
whereClause param must has the follow format "column1=? and column2=?"
```

```typescript
select(sql: string, params: Array<any>): Promise<Array<any>>;

Query the selected the table data.
sql param follow the next convention 
"SELECT [COLUMNS,] FROM TABLE WHERE column1=? and column2=?". The where can be omitted.
```

```typescript
query(table: string, columns?: Array<string>,
    selection?: string, selectionArgs?: Array<any>,
    groupBy?: string, orderBy?: string, limit?: string): Promise<Array<any>>;

Same a select

```

```typescript
execSQL(sql: string): void;

execute a sql script and do not return value
```

```typescript
beginTransact(): void;

start transaction
```

```typescript
commit(): void;

commit transaction
```

```typescript
rollback(): void;

rollback transaction
```

```typescript
close(): void;

close the sqlite database connection
```
