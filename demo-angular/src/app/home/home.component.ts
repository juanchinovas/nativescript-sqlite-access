import { Component, OnInit } from "@angular/core";
import { DbBuilder, IDatabase, DbCreationOptions } from 'nativescript-sqlite-access';
import { databaseName, creationTableQueries, dropTableQueries, databaseTables } from "../db-setting";

@Component({
    selector: "ns-home",
    moduleId: module.id,
    templateUrl: "./home.component.html"
})
export class HomeComponent implements OnInit {
    items: Array<any>;
    text: string = "";
    hint: string = 'Name something here';
    private db: IDatabase;
    private updateCounter = 0;

    constructor() {
        this.items = [];
    }

    ngOnInit(): void {
        this.db = DbBuilder(databaseName, <DbCreationOptions>{
            version: 1,
            createTableScriptsFn: () => {
                return creationTableQueries;
            },
            dropTableScriptsFn: () => {
                return dropTableQueries;
            }
        });

        this.reload();
    }

    addText() {
        let id = this.db.insert(databaseTables.PERSONS, {
            name: this.text,
            n: { No: "po' si" },
            i: 1 * ++this.updateCounter
        });
        this.text = '';
        this.reload();
    }

    remove(event: any) {
        this.db.beginTransact();
        let test = this.items[event.index];
        let deleted = this.db.delete(databaseTables.PERSONS, '_id=?', [test._id]);
        console.log("deleted count.: ", deleted);
        this.db.commit();
        this.update();
        this.reload();
    }

    update() {
        const updated = this.db.update(databaseTables.PERSONS, {
            name: "updateName-" + (this.updateCounter++)
        }, "_id=?", [1]);
        console.log("updated:", updated);
    }

    reload() {
        this.db.select(`SELECT * FROM ${databaseTables.PERSONS}`, null).process()
        .then(result => {
            this.items = result;
        })
        .catch(err => {
            console.log(err);
            console.log("jajaja");
        });

        const reducerFn = (acc, next) => {
            acc["name"] = acc["name"] || [];
            acc["name"].push(next.name);
            return acc;
        };

        const mapFn = (next) => {
            return next.name;
        };

        this.db.query(databaseTables.PERSONS)
        .reduce(reducerFn, {})
        .then(result => {
            console.log("Reducing.: ");
            console.log(result);
        })
        .catch(console.error);

        this.db.query(databaseTables.PERSONS)
        .map(mapFn)
        .then(result => {
            console.log("Mapping.: ");
            console.log(result);
        })
        .catch(console.error);
    }

}
