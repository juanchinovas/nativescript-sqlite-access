import { DbBuilder, IDatabase } from "nativescript-sqlite-access";
import { databaseTables } from "../db-setting";
import { getDb } from "./config";

describe("Database creation", () => {
	let database: IDatabase;
	before(() => {
		database = getDb("test-creation.db");
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

		it("should throws when db name missing", async () => {
			expect(() => getDb("")).to.throws("Must specify a db name");
		});

		it("should throws when db version is less than current", async () => {
			expect(() => DbBuilder("test", { version: -1 })).to.Throw;
		});
	});

	after(() => {
		database && database.close();
	});

});