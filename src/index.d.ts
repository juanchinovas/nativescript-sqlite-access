import { IDatabase, DbCreationOptions } from './sqlite-access.common';

export { DbCreationOptions, IDatabase, ReturnType, ExtendedPromise } from './sqlite-access.common';
export declare function DbBuilder(dbName: string, options?: DbCreationOptions): IDatabase;