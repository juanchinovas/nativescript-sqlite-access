import { IDatabase } from "nativescript-sqlite-access";
import { databaseTables } from "~/db-setting";
import { getDb } from "./config";

describe("#query()", function() {
	let database: IDatabase;
	const companyIds = [];
	const addAll = () => {
		[ "NookBe", "NookBe2", "NookBe3", "NookBe4", "00389F19" ].forEach( name => {
			companyIds.push(database.insert(databaseTables.WORK_COMPANIES, { name }));
		});
	};
	const getRandomId = (ids: number[]) => {
		const index = Math.floor(Math.random() * ids.length);
		return companyIds[index];
	};

	before(() => {
		database = database = getDb("test-query.db");
		addAll();
	});

	it("returns a list of rows", async () => {
		expect(
			await database.query({ tableName: databaseTables.WORK_COMPANIES }).process()
		).to.instanceOf(Array);
	});

	it("returns a list of 5 rows", async () => {
		expect(
			(await database.query<Array<unknown>>({ tableName: databaseTables.WORK_COMPANIES }).process()).length
		).to.be.equals(5);
	});

	it("returns a list of limited rows", async () => {
		expect(
			(await database.query<Array<unknown>>({
				tableName: databaseTables.WORK_COMPANIES,
				limit: "2"
			}).process()).length
		).to.be.equals(2);
	});

	it("returns a row by id", async () => {
		expect(
			(await database.query<Array<unknown>>({
				tableName: databaseTables.WORK_COMPANIES,
				selection: "_id=?",
				selectionArgs: [ getRandomId(companyIds) ]
			}).process()).length
		).to.be.equals(1);
	});

	it("returns not results", async () => {
		expect(
			(await database.query<Array<unknown>>({
				tableName: databaseTables.WORK_COMPANIES,
				selection: "_id=?",
				selectionArgs: [ 0 ]
			}).process())
		).to.be.empty;
	});

	it("returns rows with just one column", async () => {
		const rows = await database.query<Array<unknown>>({
			tableName: databaseTables.WORK_COMPANIES,
			columns: [ "name" ]
		}).process();

		expect(rows).to.deep.be.equals([
			{ name: "NookBe" }, { name: "NookBe2" }, { name: "NookBe3" }, { name: "NookBe4" }, { name: "00389F19" }
		]);
	});

	it("returns specific amount of rows", async () => {
		const rows = await database.query<Array<unknown>>({
			tableName: databaseTables.WORK_COMPANIES,
			selection: "_id in(?)",
			selectionArgs: [ companyIds ]
		}).process();

		expect(rows.length).to.be.equals(companyIds.length);
	});

	it("should apply a map function", async () => {
		expect(
			await database.query<Array<Record<string, string>>>({
				tableName: databaseTables.WORK_COMPANIES
			}).process((row: Record<string, string>) => {
				return row.name;
			})
		).to.be.deep.equals([ "NookBe", "NookBe2", "NookBe3", "NookBe4", "00389F19" ]);
	});

	it("should apply a reducer function", async () => {
		expect(
			await database.query<Array<Record<string, string>>>({
				tableName: databaseTables.WORK_COMPANIES
			}).process((acc: Record<string, number>) => {
				acc.rowCount = (acc.rowCount ?? 0) + 1;
				return acc;
			}, {})
		).to.be.deep.equals({
			"rowCount": 5
		});
	});

	describe("asGenerator", () => {
		it("returns a generator rows", async () => {
			const rowIterator = await database.query({
				tableName: databaseTables.WORK_COMPANIES
			}).asGenerator();
			expect(rowIterator.next()).to.have.nested.property("value._id");
		});

		it("returns a generator with mapped rows", async () => {
			const rowIterator = await database.query<Array<Record<string, unknown>>>({
				tableName: databaseTables.WORK_COMPANIES
			}).asGenerator((row: Record<string, unknown>) => ({ id: row._id }));
			expect(rowIterator.next()).to.have.nested.property("value.id");
		});

		it("should go throgh all the rows", async () => {
			const rowIterator = await database.select<Array<Record<string, unknown>>>(
				`SELECT * FROM ${databaseTables.WORK_COMPANIES}`
			).asGenerator((row: Record<string, unknown>) => ({ id: row._id }));
			
			for(const row of rowIterator) {
				expect(row).to.have.nested.property("id");
			}
		});
	});

	after(function() {
		database.delete(databaseTables.WORK_COMPANIES);
		database.close();
	});
});