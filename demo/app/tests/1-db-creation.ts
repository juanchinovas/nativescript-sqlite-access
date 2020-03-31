import { DbBuilder, DbCreationOptions, IDatabase } from "nativescript-sqlite-access";
import { databaseName, creationTableQueries, dropTableQueries, databaseTables } from "../db-setting";

describe("Database creation", function() {
    let database: IDatabase;
    describe("#DbBuilder(dbName, config)", function() {
        it("It should create a database and return an IDatabase object", function() {
            const config: DbCreationOptions = {
                version: 1,
                createTableScriptsFn: () => creationTableQueries,
                dropTableScriptsFn: () => dropTableQueries,
            };

            database = DbBuilder(databaseName, config);
            assert.isExtensible<IDatabase>(database);
        });

        it(`It should be created table named ${databaseTables.PERSONS}`, function(done) {
            if (database) {
                database.query(databaseTables.PERSONS)
                .then(function() {
                    done(true);
                })
                .catch(function() {
                    done(false);
                });
            } else {
                throw "No database";
            }
        });
    });

    after(function() {
        database && database.close();
    });

});