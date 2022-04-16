import { IDatabase } from "nativescript-sqlite-access";
import { databaseTables } from "../db-setting";
import { getDb } from "./config";

describe("#insert()", () => {
	const companiesName = [ "NookBe", "NookBe2", "NookBe3", "NookBe4" ];
	let database: IDatabase;
	before(() => {
		database = getDb("insert.db");
	});

	companiesName.forEach( (name, index) => {
		it(`should insert a new company unit test #${index + 1}`, async () => {
			const insertedId = database.insert(databaseTables.WORK_COMPANIES, { name });
			expect(insertedId).not.to.be.lte(0);
		});
	});

	it(`should insert numbers and floats`, async () => {
		expect(database.insert(databaseTables.WORK_COMPANIES, {
			name: "Added numbers",
			n: 5.23,
			i: 5
		})).not.to.be.lte(0);
	});

	it(`should insert json as string`, async () => {
		expect(database.insert(databaseTables.WORK_COMPANIES, {
			name: {
				prop: "value"
			}
		})).not.to.be.lte(0);
	});

	describe("Transaction", () => {
		describe("Commit", () => {
			it("shoould committed the insert", () => {
				database.beginTransact();
				const insertedId = database.insert(databaseTables.PERSONS, {
					name: "Power Ranger"
				});
				database.commit();
				expect(insertedId).to.above(0);
			});
		});
		describe("Roollback", () => {
			it("shoould rollback the inserts", async () => {
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
					resutls.filter( p => [ "Power Ranger 1", "Power Ranger 2", "Power Ranger 3" ].includes(p.name as string))
				).to.deep.equal([]);
			});
		});
	});

	after(() => {
		database.delete(databaseTables.PERSONS);
		database.delete(databaseTables.WORK_COMPANIES);
		database.close();
	});
});
