import { DbBuilder, IDatabase } from "nativescript-sqlite-access";
import { databaseTables } from "../db-setting";
import { getDb } from "./config";

describe("#replace()", function() {
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
        database = database = getDb("test-replace.db");
		addAll();
    });

    it("replaces company name", () => {
		expect(
			database.replace(databaseTables.WORK_COMPANIES, {
				name: "Filly Lollo",
				_id: getRandomId(companyIds)
			})
		).to.be.equal(1);

    });

	describe("Transaction", () => {
		describe("Commit", () => {
			it("should commit", () => {
				database.beginTransact();
				const rowsAffected = database.replace(databaseTables.WORK_COMPANIES, {
					name: "Mixed Box",
					_id: getRandomId(companyIds)
				});
				database.commit();

				expect(rowsAffected).to.be.equals(1);
		
			});
		});

		describe("Rollback", () => {
			it("should rollback", async () => {
				const id = getRandomId(companyIds);
				database.beginTransact();
				database.replace(databaseTables.WORK_COMPANIES, {
					name: "NookBe is bad",
					_id: id
				});
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

    after(function() {
		database.delete(databaseTables.WORK_COMPANIES);
        database.close();
    });
});
