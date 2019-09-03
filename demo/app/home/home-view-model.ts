import { Observable } from "tns-core-modules/data/observable";
import {DbBuilder, IDatabase, DbCreationOptions} from 'nativescript-sqlite-access';

export class HomeViewModel extends Observable {
    private db: IDatabase;
    constructor() {
        super();
        this.db = DbBuilder("people.db", <DbCreationOptions>{
            version: 1,
            createTableScriptsFn: ()=> {
                return ['CREATE TABLE if not exists people(_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)'];
            },
            dropTableScriptsFn:()=> { 
                return ['DROP TABLE IF EXISTS people']
            }
        });

        this.set('text', '');
        this.set('hint', 'name me here');
        this.set('items', []);
        this.reload();
    }


    addText() {
        let id = this.db.insert("people", {
            name: this.get('text')
        });
        this.set('text', '');
        this.reload();
    }

    remove(event) {
        this.db.beginTransact();
        let test = this.get("items")[event.index];
        let deleted = this.db.delete("people", '_id=?', [test._id]);
        console.log("deleted count.: ", deleted);
        this.db.rollback();
        this.reload();
    }

    reload() {
        this.db.select("SELECT * FROM people", null).then(result=> {
            this.set('items', result);
        })
        .catch(console.error);
    }

}
