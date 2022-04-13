import { DbBuilder, IDatabase } from "nativescript-sqlite-access";
import { databaseName, databaseTables } from "../db-setting";

describe("#update()", function() {
    let database: IDatabase;
    before(function() {
        database = DbBuilder(databaseName);
    });

    it("Update company", function(done) {
        database.update(databaseTables.WORK_COMPANIES, {
            name: "NookBe is for connect"
        }, "_id=?", [1]);

        database.query({
            tableName: databaseTables.WORK_COMPANIES,
            columns: ["name"],
            selection: "_id=?",
            selectionArgs: [1]
        }).process()
        .then(function(results: Array<any>) {
            let result = results.pop();
            done(result.name === "NookBe is for connect");
        })
        .catch(done);

    });

    it("Update company and committed", function(done) {
        database.beginTransact();
        database.update(databaseTables.WORK_COMPANIES, {
            name: "NookBe updated"
        }, "_id=?", [1]);
        database.commit();

        database.query({
            tableName: databaseTables.WORK_COMPANIES,
            columns: ["name"],
            selection: "_id=?",
            selectionArgs: [1]
        }).process()
        .then(function(results: Array<any>) {
            let result = results.pop();
            done(result.name === "NookBe updated");
        })
        .catch(done);
    });

    it("person table #3 Transaction rollback", function(done) {
        database.beginTransact();
        database.update(databaseTables.WORK_COMPANIES, {
            name: "NookBe is bad"
        }, "_id=?", [1]);
        database.rollback();

        database.query({
            tableName: databaseTables.WORK_COMPANIES,
            columns: ["name"],
            selection: "_id=?",
            selectionArgs: [1]
        }).process()
        .then(function(results: Array<any>) {
            let result = results.pop();
            done(result.name === "NookBe updated");
        })
        .catch(done);
    });

    after(function() {
        database.close();
    });

});
