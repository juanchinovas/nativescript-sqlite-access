import { DbCreationOptions, DbBuilder } from "nativescript-sqlite-access";
import { creationTableQueries, dropTableQueries } from "~/db-setting";


export function getDb(databaseName: string) {
	const config: DbCreationOptions = {
		createTableScriptsFn: () => creationTableQueries,
		dropTableScriptsFn: () => dropTableQueries,
	};
	return DbBuilder(databaseName, config);
}