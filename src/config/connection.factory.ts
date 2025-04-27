import { DbEngines } from '../lib';
import { MSSQLConnection } from './mssql.connection';
import { MySQLConnection } from './mysql.connection';
import { PostgresConnection } from './postgres.connection';

export class DatabaseConnectionFactory {
  static createConnection(dbType: DbEngines) {
    switch (dbType) {
      case 'mysql':
        return new MySQLConnection();
      case 'postgres':
        return new PostgresConnection();
      case 'mssql':
        return new MSSQLConnection();
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }
}
