import { IDatabase } from "nativescript-sqlite-access";
import { databaseTables } from "../db-setting";
import { getDb } from "./config";

describe("#replace()", function() {
	let database: IDatabase;
	const companyIds = [];
	const addAll = () => {
		[ "NookBe", "NookBe2", "NookBe3", "NookBe4" ].forEach( name => {
			companyIds.push(database.insert(databaseTables.WORK_COMPANIES, { name }));
		});
	};
	const getRandomId = (ids: number[]) => {
		const index = Math.floor(Math.random() * ids.length);
		return companyIds[index];
	};

	before(() => {
		database = database = getDb("test-replace.db");
		addAll();
	});

	it("replaces company name", () => {
		const id = getRandomId(companyIds);
		expect(
			database.replace(databaseTables.WORK_COMPANIES, {
				name: "Filly Lollo",
				_id: id
			})
		).to.be.equal(id);

	});

	describe("Transaction", () => {
		describe("Commit", () => {
			it("should commit", () => {
				const id = getRandomId(companyIds);
				database.beginTransact();
				const idAffected = database.replace(databaseTables.WORK_COMPANIES, {
					name: "Mixed Box",
					_id: id
				});
				database.commit();

				expect(idAffected).to.be.equals(id);
		
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
						selection: "_id", selectionArgs: [ id ]
					}).process()
				).not.to.be.deep.include({ name: "NookBe is bad" });
			});
		});
	});

	after(function() {
		database.delete(databaseTables.WORK_COMPANIES);
		database.close();
	});
});
