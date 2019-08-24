import { Observable } from "tns-core-modules/data/observable";
import {builder, IDatabase} from 'nativescript-sqlite-access';

export class HomeViewModel extends Observable {
    private db: IDatabase;
    constructor() {
        super();

        this.db = builder("test.sqlite");

        //console.log(d.builder);
        //console.log(d.SqliteAccess);
        //console.log(d);

        this.set('text', 'test me here');
    }

    ;


    addText() {}

}
