import { MysqlRepository } from './mysql.repository';
import { PostgresRepository } from './postgres.repository';
import { Client } from 'pg';
import { Connection } from 'mysql2/promise';
import { ConnectionPool } from 'mssql';
import { MssqlRepository } from './mssql.repository';
import { DbEngines } from '../types';

export class DBRepositoryFactory {
  static createRepository(
    dbType: DbEngines,
    connection: Connection | Client | ConnectionPool //   : IRepository<any>
  ) {
    switch (dbType) {
      case 'mysql':
        return new MysqlRepository(connection as Connection);
      case 'postgres':
        return new PostgresRepository(connection as Client);
      case 'mssql':
        return new MssqlRepository(connection as ConnectionPool);
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }
}
