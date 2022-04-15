import { IDatabase } from "nativescript-sqlite-access";
import { databaseTables } from "../db-setting";
import { getDb } from "./config";

describe("#delete()", function() {
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

    before(function() {
        database = getDb("test-delete.db");
    });

	beforeEach(addAll);
	afterEach(() => {
		companyIds = [];
	});

    it("should delete all the company names", () => {
		let rowsAffected = 0;
		companyIds.forEach( (id) => {
			rowsAffected += database.delete(databaseTables.WORK_COMPANIES, "_id=?", [id]);
		});
        expect(rowsAffected).to.be.equals(4);
    });

	describe("Transaction", () => {
		describe("Commit", () => {
			it("should commit", () => {
				database.beginTransact();
				const rowsAffected = database.delete(databaseTables.WORK_COMPANIES, "_id=?", [getRandomId(companyIds)]);
				database.commit();
				expect(rowsAffected).to.be.equals(1);
		
			});
		});

		describe("Rollback", () => {
			it("should rollback", async () => {
				const id = getRandomId(companyIds);
				database.beginTransact();
				const rowsAffected = database.delete(databaseTables.WORK_COMPANIES, "_id=?", [id]);
				database.rollback();
		
				expect(rowsAffected).to.be.equals(1);
				expect((await database.query<unknown[]>({
					tableName: databaseTables.WORK_COMPANIES,
					columns: ['_id'],
					selection: '_id=' + id
				}).process()).pop()).to.have.property("_id", id);
			});
		});
	});

    it("should delete all the company names at one", () => {
		const idsLen = companyIds.length;
		let rowsAffected = database.delete(databaseTables.WORK_COMPANIES, "_id in(?)", [companyIds]);
        expect(rowsAffected).to.be.equals(idsLen);
    });

    after(function() {
		database.delete(databaseTables.WORK_COMPANIES);
        database.close();
    });

});
