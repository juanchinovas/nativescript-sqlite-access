import { DbBuilder, IDatabase } from "nativescript-sqlite-access";
import { databaseName, databaseTables } from "../db-setting";

describe("#delete()", function() {
    let database: IDatabase;
    before(function() {
        database = DbBuilder(databaseName);
    });

    it("delete company", function(done) {
        database.delete(databaseTables.WORK_COMPANIES, "_id=?", [1]);

        database.query(databaseTables.WORK_COMPANIES, ["name"], "_id=?", [1])
        .then(function(results) {
            done(results.length === 0);
        })
        .catch(done);
    });

    it("Delete person and committed", function(done) {
        database.beginTransact();
        database.delete(databaseTables.PERSONS, "_id=?", [3]);
        database.commit();

        database.query(databaseTables.PERSONS, ["name"], "_id=?", [3])
        .then(function(results) {
            done(results.length === 0);
        })
        .catch(done);

    });
    it("Delete person and rollback", function(done) {
        database.beginTransact();
        database.delete(databaseTables.PERSONS, "_id=?", [2]);
        database.rollback();

        database.query(databaseTables.PERSONS, ["name"], "_id=?", [2])
        .then(function(results) {
            let result = results.pop();
            done(result.name === "Carlos Done");
        })
        .catch(done);
    });

    after(function() {
        database.close();
    });

});
