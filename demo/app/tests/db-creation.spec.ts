import { DbBuilder, DbCreationOptions, IDatabase } from "nativescript-sqlite-access";
import { creationTableQueries, dropTableQueries, databaseTables } from "../db-setting";

describe("Database creation", () => {
    let database: IDatabase;
	const databaseName = "test-creation.db";
	before(() => {
		const config: DbCreationOptions = {
			version: 1,
			createTableScriptsFn: () => creationTableQueries,
			dropTableScriptsFn: () => dropTableQueries,
		};

		database = DbBuilder(databaseName, config);
	});

    describe("#DbBuilder(dbName, config)", () => {
        it("returns an IDatabase object", () => {
			assert.isExtensible<IDatabase>(database);
			expect(database).not.null;
        });

        it(`should has a table named ${databaseTables.PERSONS}`, async () => {
            const results = (await database.query({ tableName: databaseTables.PERSONS, limit: "1" }).process()) as Array<unknown>;
			expect(results).to.be.instanceOf(Array);
			expect(results.length).to.be.equal(0);
        });
    });

    after(() => {
        database && database.close();
    });

});