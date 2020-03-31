
/**Database tables enum */
export const databaseName = "database_test.sqlite";

export const enum databaseTables {
    PERSONS = "persons",
    WORK_COMPANIES = "companies"
}

export const creationTableQueries = [
    `CREATE TABLE ${databaseTables.WORK_COMPANIES} (_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)`,
    `CREATE TABLE ${databaseTables.PERSONS} (_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, id_company INTEGER)`
];

export const dropTableQueries = [
    `DROP TABLE ${databaseTables.WORK_COMPANIES}`,
    `DROP TABLE ${databaseTables.PERSONS}`
];