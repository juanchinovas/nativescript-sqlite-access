import { IDatabase } from "nativescript-sqlite-access";
import { databaseTables } from "~/db-setting";
import { getDb } from "./config";

describe("#selet()", function() {
	let database: IDatabase;
	const companyIds = [];
	const addAll = () => {
		[ "NookBe", "NookBe2", "NookBe3", "NookBe4",  "00389F19" ].forEach( name => {
			companyIds.push(database.insert(databaseTables.WORK_COMPANIES, { name }));
		});
	};
	const getRandomId = (ids: number[]) => {
		const index = Math.floor(Math.random() * ids.length);
		return companyIds[index];
	};

	before(() => {
		database = database = getDb("test-selet.db");
		addAll();
	});

	it("returns a list of rows", async () => {
		expect(
			await database.select(`SELECT * FROM ${databaseTables.WORK_COMPANIES}`).process()
		).to.instanceOf(Array);
	});

	it("returns a list of 5 rows", async () => {
		expect(
			(await database.select<Array<unknown>>(`SELECT * FROM ${databaseTables.WORK_COMPANIES}`).process()).length
		).to.be.equals(5);
	});

	it("returns a list of limited rows", async () => {
		expect(
			(await database.select<Array<unknown>>(
				`SELECT * FROM ${databaseTables.WORK_COMPANIES} LIMIT 2`
			).process()).length
		).to.be.equals(2);
	});

	it("returns a row by id", async () => {
		expect(
			(await database.select<Array<unknown>>(
				`SELECT * FROM ${databaseTables.WORK_COMPANIES} WHERE _id=?`
				,[ getRandomId(companyIds) ]
			).process()).length
		).to.be.equals(1);
	});

	it("returns not results", async () => {
		expect(
			(await database.select<Array<unknown>>(
				`SELECT * FROM ${databaseTables.WORK_COMPANIES} WHERE _id=?`
				,[ 0 ]
			).process())
		).to.be.empty;
	});

	it("returns rows with just one column", async () => {
		const rows = await database.select<Array<unknown>>(
			`SELECT name FROM ${databaseTables.WORK_COMPANIES}`
		).process();

		expect(rows).to.deep.be.equals([
			{ name: "NookBe" }, { name: "NookBe2" }, { name: "NookBe3" }, { name: "NookBe4" }, { name: "00389F19" }
		]);
	});

	it("returns specific amount of rows", async () => {
		const rows = await database.select<Array<unknown>>(
			`SELECT name FROM ${databaseTables.WORK_COMPANIES} WHERE _id in(?)`,
			[ companyIds ]
		).process();

		expect(rows.length).to.be.equals(companyIds.length);
	});

	it("should apply a map function", async () => {
		expect(
			await database.select<Array<Record<string, string>>>(
				`SELECT * FROM ${databaseTables.WORK_COMPANIES}`
			).process((row: Record<string, string>) => {
				return row.name;
			})
		).to.be.deep.equals([ "NookBe", "NookBe2", "NookBe3", "NookBe4", "00389F19" ]);
	});

	it("should apply a reducer function", async () => {
		expect(
			await database.select<Array<Record<string, string>>>(
				`SELECT * FROM ${databaseTables.WORK_COMPANIES}`
			).process((acc: Record<string, number>) => {
				acc.rowCount = (acc.rowCount ?? 0) + 1;
				return acc;
			}, {})
		).to.be.deep.equals({
			"rowCount": 5
		});
	});

	it("should save json as string and return it as json", async () => {
		const _id = database.insert(databaseTables.PERSONS, {
			name: {
				prop: "Person #1"
			}
		});
		expect(
			await database.select<Array<Record<string, string>>>(
				`SELECT * FROM ${databaseTables.PERSONS}`
			).process()
		).to.have.deep.include(
			{
				_id,
				name: {
					prop: "Person #1"
				},
				n: null,
				i: null,
				id_company: null
			}
		);
	});

	it("should read numbers as well float", async () => {
		const _id = database.insert(databaseTables.PERSONS, {
			name:  "Person #2",
			n: 2.23,
			i: 8
		});
		expect(
			await database.select<Array<Record<string, string>>>(
				`SELECT * FROM ${databaseTables.PERSONS}`
			).process()
		).to.deep.include(
			{
				_id,
				name:  "Person #2",
				n: 2.23,
				i: 8,
				id_company: null
			}
		);
	});

	describe("asGenerator", () => {
		it("returns a generator rows", async () => {
			const rowIterator = await database.select(
				`SELECT * FROM ${databaseTables.WORK_COMPANIES}`
			).asGenerator();
			expect(rowIterator.next()).to.have.nested.property("value._id");
		});

		it("returns a generator with mapped rows", async () => {
			const rowIterator = await database.select<Array<Record<string, unknown>>>(
				`SELECT * FROM ${databaseTables.WORK_COMPANIES}`
			).asGenerator((row: Record<string, unknown>) => ({ id: row._id }));
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
		database.delete(databaseTables.PERSONS);
		database.close();
	});
});