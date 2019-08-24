import { Observable } from "tns-core-modules/data/observable";
import {DbBuilder, IDatabase, DbCreationOptions} from 'nativescript-sqlite-access';

export class HomeViewModel extends Observable {
    private db: IDatabase;
    constructor() {
        super();

        this.db = DbBuilder("test.sqlite", <DbCreationOptions>{
            version: 3,
            createTableScriptsFn: ()=> {
                return ['CREATE TABLE test (ID INTEGER PRIMARY KEY AUTOINCREMENT, test TEXT)'];
            },
            dropTableScriptsFn:()=> { 
                return ['DROP TABLE IF EXISTS test']
            }
        });

        this.set('text', '');
        this.set('hint', 'Test me here');
        this.set('items', []);
        this.reload();
    }


    addText() {
        let id = this.db.insert("test", {
            test: this.get('text')
        });
        this.set('text', '');
        this.reload();
    }

    remove(event) {
        this.db.beginTransact();
        let test = this.get("items")[event.index];
        let deleted = this.db.delete("test", 'ID=?', [test.ID]);
        console.log("deleted count.: ", deleted);
        this.db.commit();
        this.reload();
    }

    reload() {
        this.db.select("SELECT * FROM test", null).then(result=> {
            //this.set('items', result);
            console.log(result);
        })
        .catch(console.error);
    }

}
