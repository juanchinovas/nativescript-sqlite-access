
/**Database tables enum */
export const databaseName = "database_test_angular.db";

export const enum databaseTables {
    PERSONS = "persons"
}

export const creationTableQueries = [
    `CREATE TABLE ${databaseTables.PERSONS} (_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, n real, i integer)`
];

export const dropTableQueries = [
    `DROP TABLE ${databaseTables.PERSONS}`
];