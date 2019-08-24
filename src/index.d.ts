import { IDatabase } from './common/IDatabase';
import { DbCreationOptions } from './common/Common';

export * from './common/IDatabase';
export * from './common/Common';

export declare function DbBuilder(dbName: string, options?: DbCreationOptions): IDatabase;