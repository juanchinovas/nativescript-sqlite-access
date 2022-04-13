import { DbBuilder, IDatabase } from "nativescript-sqlite-access";
import { databaseName, databaseTables } from "../db-setting";

describe("#insert()", function() {
    let database: IDatabase;
    before(function() {
        database = DbBuilder(databaseName);
    });

    it("company table #1", function() {
        let insertedId = database.insert(databaseTables.WORK_COMPANIES, {
            name: "NookBe"
        });
        assert.equal(insertedId, 1);
    });

    it("company table #2", function() {
        let insertedId = database.insert(databaseTables.WORK_COMPANIES, {
            name: "NookBe2"
        });
        assert.equal(insertedId, 2);
    });

    it("person table #1", function() {
        let insertedId = database.insert(databaseTables.PERSONS, {
            name: "Novas Done"
        });
        assert.equal(insertedId, 1);
    });

    it("person table #2", function() {
        let insertedId = database.insert(databaseTables.PERSONS, {
            name: "Kind Power"
        });
        assert.equal(insertedId, 2);
    });

    it("person table #3 Transaction committed", function() {
        database.beginTransact();
        let insertedId = database.insert(databaseTables.PERSONS, {
            name: "Power Ranger"
        });
        database.commit();
        assert.equal(insertedId, 3);
    });
    it("person table #3 Transaction rollback", function(done) {
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

        database.select(`SELECT COUNT(*) account FROM ${databaseTables.PERSONS}`).process()
        .then(function(results: Array<any>) {
            let result = results.pop();
            done(result.count === 3);
        })
        .catch(done);
    });

    after(function() {
        database.close();
    });
});
