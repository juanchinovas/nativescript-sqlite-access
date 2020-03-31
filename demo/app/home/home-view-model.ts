import { Observable } from "tns-core-modules/data/observable";
import {DbBuilder, IDatabase, DbCreationOptions} from 'nativescript-sqlite-access';

export class HomeViewModel extends Observable {
    private db: IDatabase;
    private updateCounter = 0;
    constructor() {
        super();
        this.db = DbBuilder("people.db", <DbCreationOptions>{
            version: 1,
            createTableScriptsFn: () => {
                return ['CREATE TABLE if not exists people(_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, n real, i integer)'];
            },
            dropTableScriptsFn: () => {
                return ['DROP TABLE IF EXISTS people'];
            }
        });

        this.set('text', '');
        this.set('hint', 'Name something here');
        this.set('items', []);
        this.reload();
    }


    addText() {
        let id = this.db.insert("people", {
            name: this.get('text'),
            n: 45.23,
            i: 2 * this.updateCounter
        });
        this.set('text', '');
        this.reload();
    }

    remove(event) {
        this.db.beginTransact();
        let test = this.get("items")[event.index];
        let deleted = this.db.delete("people", '_id=?', [test._id]);
        console.log("deleted count.: ", deleted);
        this.db.commit();
        this.update();
        this.reload();
    }

    update() {
        const updated = this.db.update("people", {
            name: "updateName-" + (this.updateCounter++)
        }, "_id=?", [1]);
        console.log("updated:", updated);
    }

    reload() {
        this.db.select("SELECT * FROM people", null).then(result => {
            this.set('items', result);
        })
        .catch(console.error);

        const reducerFn = (acc, next) => {
            acc["name"] = acc["name"] || [];
            acc["name"].push(next.name);
            return acc;
        };

        // @ts-ignore
        this.db.select("SELECT * FROM people", null, reducerFn).then(result => {
            console.log(result);
        })
        .catch(console.error);
    }

}
