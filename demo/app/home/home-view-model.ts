import { Observable } from "@nativescript/core";
import {DbBuilder, IDatabase, DbCreationOptions} from 'nativescript-sqlite-access';
import { databaseName, creationTableQueries, dropTableQueries, databaseTables } from "../db-setting";

export class HomeViewModel extends Observable {
    private db: IDatabase;
    private updateCounter = 0;
    constructor() {
        super();
        this.db = DbBuilder(databaseName, <DbCreationOptions>{
            version: 1,
            createTableScriptsFn: () => creationTableQueries,
            dropTableScriptsFn: () => dropTableQueries
        });

        this.set('text', '');
        this.set('hint', 'Name something here');
        this.set('items', []);
        this.reload();
    }


    addText() {
        let id = this.db.insert(databaseTables.PERSONS, {
            name: this.get('text'),
            n: 45.5,
            i: 1 * ++this.updateCounter
        });
        console.log("id", id);
        this.set('text', '');
        this.reload();
    }

    remove(event) {
        this.db.beginTransact();
        let test = this.get("items")[event.index];
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
        this.db.select(`SELECT * FROM ${databaseTables.PERSONS}`).process()
        .then(result => {
            this.set('items', result);
        })
        .catch(console.error);

        const reducerFn = (acc, next) => {
            acc["name"] = acc["name"] || [];
            acc["name"].push(next.name);
            return acc;
        };

        const mapFn = (next) => {
            return next.name;
        };

        this.db.query({ tableName: databaseTables.PERSONS })
        .reduce(reducerFn, {})
        .then(result => {
            console.log("Reducing.: ");
            console.log(result);
        })
        .catch(console.error);

        this.db.query({ tableName: databaseTables.PERSONS })
        .map(mapFn)
        .then(result => {
            console.log("Mapping.: ");
            console.log(result);
        })
        .catch(console.error);
    }

}
