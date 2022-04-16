import { IDatabase } from "nativescript-sqlite-access";
import { databaseTables } from "../db-setting";
import { getDb } from "./config";

describe("#upsert()", function() {
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
		database = database = getDb("test-upsert.db");
		addAll();
	});

	it("update company name", async () => {
		const id = getRandomId(companyIds);
		expect(
			await database.upsert(databaseTables.WORK_COMPANIES, {
				name: "Filly Lollo",
				_id: id
			})
		).to.be.equal(id);
	});

	it("should insert a new company name", async () => {
		expect(
			await database.upsert(databaseTables.WORK_COMPANIES, {
				name: "new company name"
			})
		).to.be.gt(0);
	});

	it("should throw when table has not primary key columns", (done) => {
		database.upsert(databaseTables.EXTA, {
			name: "Filly Lollo",
			i: 12,
			n: 45.23
		})
		.then(done)
		.catch((err) => {
			if (err.message === "extras doesn't have primary key columns") {
				return done();
			}
			done(err);
		});
	});

	describe("Transaction", () => {
		describe("Commit", () => {
			it("should commit", async () => {
				const id = getRandomId(companyIds);
				database.beginTransact();
				const idAffected = await database.upsert(databaseTables.WORK_COMPANIES, {
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
				await database.upsert(databaseTables.WORK_COMPANIES, {
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
		database.delete(databaseTables.EXTA);
		database.close();
	});
});
