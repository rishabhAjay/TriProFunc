import { DbEngines } from '../types';
import { MssqlDAL } from './mssql.dal';
import { MysqlDAL } from './mysql.dal';
import { PostgresDAL } from './postgres.dal';

export class DALFactory {
  static createRepository(dbType: DbEngines) {
    switch (dbType) {
      case 'mysql':
        return new MysqlDAL();
      case 'postgres':
        return new PostgresDAL();
      case 'mssql':
        return new MssqlDAL();
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }
}
