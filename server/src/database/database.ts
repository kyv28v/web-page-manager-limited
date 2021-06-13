import { DB_TYPE } from '../config/common';
import { Postgres } from './postgres/postgres';
import { MongoDB } from '../database/mongodb/mongodb';

export interface Database {
  connect(): Promise<any>;
  release(): Promise<any>;
  query(action: string, values: any): Promise<any>;
  begin(): Promise<any>;
  commit(): Promise<any>;
  rollback(): Promise<any>;
}

export const getDatabase = () => {
  if (DB_TYPE == 'postgres') {
    return new Postgres();;
  } else {
    return new MongoDB();;
  }
};

