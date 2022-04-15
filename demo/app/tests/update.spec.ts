import { IDatabase } from "nativescript-sqlite-access";
import { databaseTables } from "../db-setting";
import { getDb } from "./config";

describe("#update()", function() {
    let database: IDatabase;
	let companyIds = [];
	const addAll = () => {
		["NookBe", "NookBe2", "NookBe3", "NookBe4"].forEach( name => {
			companyIds.push(database.insert(databaseTables.WORK_COMPANIES, { name }));
		});
	};
	const getRandomId = (ids: number[]) => {
		const index = Math.floor(Math.random() * ids.length);
		return companyIds[index];
	}

    before(() => {
        database = database = getDb("test-update.db");
		addAll();
    });

    it("updates the company name", () => {
		const id = getRandomId(companyIds);
        expect(
			database.update(databaseTables.WORK_COMPANIES, {
				name: "NookBe is for connect"
			}, "_id=?", [id])
		).to.be.equal(1);
    });

    it("changes the company name", async () => {
		const id = getRandomId(companyIds);
		database.update(
			databaseTables.WORK_COMPANIES,
			{
				name: "NookBe updated"
			},
			"_id=?", [id]
		);

		expect(
			await database.query({
				columns: [ "name" ],
				tableName: databaseTables.WORK_COMPANIES,
				selection: "_id=?", selectionArgs: [id]
			}).process()
		).to.be.deep.equals([{ name: "NookBe updated"}]);
    });

	describe("Transaction", () => {
		describe("Commit", () => {
			it("should commit", () => {
				database.beginTransact();
				const rowsAffected = database.update(databaseTables.WORK_COMPANIES, {
					name: "NookBe committed"
				}, "_id=?", [getRandomId(companyIds)]);
				database.commit();
				expect(rowsAffected).to.be.equals(1);
		
			});
		});

		describe("Rollback", () => {
			it("should rollback", async () => {
				const id = getRandomId(companyIds);
				database.beginTransact();
				const rowsAffected = database.update(databaseTables.WORK_COMPANIES, {
					name: "NookBe is bad"
				}, "_id=?", [id]);
				database.rollback();
		
				expect(
					await database.query({
						columns: [ "name" ],
						tableName: databaseTables.WORK_COMPANIES,
						selection: "_id", selectionArgs: [id]
					}).process()
				).not.to.be.deep.include({ name: "NookBe is bad"});
			});
		});
	});

    after(() => {
		database.delete(databaseTables.WORK_COMPANIES);
        database.close();
    });
});
