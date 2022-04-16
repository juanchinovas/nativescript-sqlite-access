
/**Database tables enum */
export const databaseName = "database_test.db";

export const enum databaseTables {
    PERSONS = "persons",
    WORK_COMPANIES = "companies",
    EXTA = "extras",
}

export const creationTableQueries = [
	`CREATE TABLE ${databaseTables.WORK_COMPANIES} (_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, n real, i integer)`,
	`CREATE TABLE ${databaseTables.PERSONS} (_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, id_company INTEGER, n real, i integer)`,
	`CREATE TABLE ${databaseTables.EXTA} (name TEXT, n real, i integer)`,
];

export const dropTableQueries = [
	`DROP TABLE ${databaseTables.WORK_COMPANIES}`,
	`DROP TABLE ${databaseTables.PERSONS}`,
	`DROP TABLE ${databaseTables.EXTA}`,
];