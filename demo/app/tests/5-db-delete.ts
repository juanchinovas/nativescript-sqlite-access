import { DbBuilder, IDatabase } from "nativescript-sqlite-access";
import { databaseName, databaseTables } from "../db-setting";

describe("#delete()", function() {
    let database: IDatabase;
    before(function() {
        database = DbBuilder(databaseName);
    });

    it("delete company", function(done) {
        database.delete(databaseTables.WORK_COMPANIES, "_id=?", [1]);

        database.query({
            tableName: databaseTables.WORK_COMPANIES,
            columns: ["name"],
            selection: "_id=?",
            selectionArgs: [3]
        }).process()
        .then(function(results: Array<any>) {
            done(results.length === 0);
        })
        .catch(done);
    });

    it("Delete person and committed", function(done) {
        database.beginTransact();
        database.delete(databaseTables.PERSONS, "_id=?", [3]);
        database.commit();

        database.query({
            tableName: databaseTables.PERSONS,
            columns: ["name"],
            selection: "_id=?",
            selectionArgs: [3]
        }).process()
        .then(function(results: Array<any>) {
            done(results.length === 0);
        })
        .catch(done);

    });
    it("Delete person and rollback", function(done) {
        database.beginTransact();
        database.delete(databaseTables.PERSONS, "_id=?", [2]);
        database.rollback();

        database.query({
            tableName: databaseTables.PERSONS,
            columns: ["name"],
            selection: "_id=?",
            selectionArgs: [2]
        }).process()
        .then(function(results: Array<any>) {
            let result = results.pop();
            done(result.name === "Novas Done");
        })
        .catch(done);
    });

    after(function() {
        database.close();
    });

});
