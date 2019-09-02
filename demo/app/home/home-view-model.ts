import { Observable } from "tns-core-modules/data/observable";
import {DbBuilder, IDatabase, DbCreationOptions, ReturnType} from 'nativescript-sqlite-access';

export class HomeViewModel extends Observable {
    private db: IDatabase;
    constructor() {
        super();
        this.db = DbBuilder("test.db", <DbCreationOptions>{
            version: 1,
            createTableScriptsFn: ()=> {
                return ['CREATE TABLE if not exists testttt(_id INTEGER PRIMARY KEY AUTOINCREMENT, textu TEXT)'];
            },
            dropTableScriptsFn:()=> { 
                return ['DROP TABLE IF EXISTS testttt']
            }
        });

        this.set('text', '');
        this.set('hint', 'Test me here');
        this.set('items', []);
        this.reload();
    }


    addText() {
        let id = this.db.insert("testttt", {
            textu: this.get('text')
        });
        this.set('text', '');
        this.reload();
    }

    remove(event) {
        this.db.beginTransact();
        let test = this.get("items")[event.index];
        let deleted = this.db.delete("testttt", '_id=?', [test._id]);
        console.log("deleted count.: ", deleted);
        this.db.rollback();
        this.reload();
    }

    reload() {
        this.db.select("SELECT * FROM testttt", null).then(result=> {
            this.set('items', result);
        })
        .catch(console.error);
    }

}
