import { DbBuilder, DbCreationOptions, IDatabase } from "nativescript-sqlite-access";
import { creationTableQueries, databaseTables, dropTableQueries } from "../db-setting";

describe("#insert()", () => {
    let database: IDatabase;
	const databaseName = "insert.db";
    before(() => {
		const config: DbCreationOptions = {
			createTableScriptsFn: () => creationTableQueries,
			dropTableScriptsFn: () => dropTableQueries,
		};
        database = DbBuilder(databaseName, config);
    });

    it("company table #1", async () => {
        const insertedId = database.insert(databaseTables.WORK_COMPANIES, {
            name: "NookBe"
        });
		const lastInserted = await database.query<Array<Record<string, unknown>>>(
			{
				tableName: databaseTables.WORK_COMPANIES,
				selection: '_id=?',
				selectionArgs: [insertedId]
			}).process();

		expect(lastInserted[0].name).to.be.eq("NookBe");
    });

    it("company table #2", async () => {
        let insertedId = database.insert(databaseTables.WORK_COMPANIES, {
            name: "NookBe2"
        });
		const lastInserted = await database.query(
			{
				tableName: databaseTables.WORK_COMPANIES,
				selection: '_id=?',
				selectionArgs: [insertedId]
			}).process() as Array<Record<string, unknown>>;

		expect(lastInserted[0].name).to.be.eq("NookBe2");
    });

    it("person table #1", () => {
        let insertedId = database.insert(databaseTables.PERSONS, {
            name: "Novas Done"
        });
		expect(insertedId).to.above(0);
    });

    it("person table #2", async () => {
        let insertedId = database.insert(databaseTables.PERSONS, {
            name: "Kind Power"
        });
		const lastInserted = await database.query(
			{
				tableName: databaseTables.PERSONS,
				selection: '_id=?',
				selectionArgs: [insertedId]
			}).process() as Array<Record<string, unknown>>;

		expect(lastInserted[0].name).to.be.eq("Kind Power");
    });

    it("person table #3 Transaction committed", () => {
        database.beginTransact();
        let insertedId = database.insert(databaseTables.PERSONS, {
            name: "Power Ranger"
        });
        database.commit();
		expect(insertedId).to.above(1);
    });
    it("person table #3 Transaction rollback", async () => {
        database.beginTransact();
        database.insert(databaseTables.PERSONS, {
            name: "Power Ranger 1"
        });
        database.insert(databaseTables.PERSONS, {
            name: "Power Ranger 2"
        });
        database.insert(databaseTables.PERSONS, {
            name: "Power Ranger 3"
        });
        database.rollback();

        const resutls = await database.select(`SELECT COUNT(*) account FROM ${databaseTables.PERSONS}`)
		.process() as Array<Record<string, unknown>>;

		expect(
			resutls.filter( p => ["Power Ranger 1", "Power Ranger 2", "Power Ranger 3"].includes(p.name as string))
		).to.deep.equal([]);

    });

    after(() => {
        database.close();
    });
});
