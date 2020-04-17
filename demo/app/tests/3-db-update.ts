import { DbBuilder, IDatabase } from "nativescript-sqlite-access";
import { databaseName, databaseTables } from "../db-setting";

describe("#update()", function() {
    let database: IDatabase;
    before(function() {
        database = DbBuilder(databaseName);
    });

    it("Update company", function(done) {
        database.update(databaseTables.WORK_COMPANIES, {
            name: "Facebook is for connect"
        }, "_id=?", [1]);

        database.query(databaseTables.WORK_COMPANIES, ["name"], "_id=?", [1]).process()
        .then(function(results) {
            let result = results.pop();
            done(result.name === "Facebook is for connect");
        })
        .catch(done);

    });

    it("Update company and committed", function(done) {
        database.beginTransact();
        database.update(databaseTables.WORK_COMPANIES, {
            name: "Facebook updated"
        }, "_id=?", [1]);
        database.commit();

        database.query(databaseTables.WORK_COMPANIES, ["name"], "_id=?", [1]).process()
        .then(function(results) {
            let result = results.pop();
            done(result.name === "Facebook updated");
        })
        .catch(done);
    });

    it("person table #3 Transaction rollback", function(done) {
        database.beginTransact();
        database.update(databaseTables.WORK_COMPANIES, {
            name: "Facebook is bad"
        }, "_id=?", [1]);
        database.rollback();

        database.query(databaseTables.WORK_COMPANIES, ["name"], "_id=?", [1]).process()
        .then(function(results) {
            let result = results.pop();
            done(result.name === "Facebook updated");
        })
        .catch(done);
    });

    after(function() {
        database.close();
    });

});
