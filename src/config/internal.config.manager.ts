import { MySQLConnection } from './mysql.connection';
import { PostgresConnection } from './postgres.connection';
import { MSSQLConnection } from './mssql.connection';
import { MysqlRepository } from '../lib/repositories/mysql.repository';
import { PostgresRepository } from '../lib/repositories/postgres.repository';
import { MssqlRepository } from '../lib/repositories/mssql.repository';
import { MysqlDAL } from '../lib/DAL/mysql.dal';
import { PostgresDAL } from '../lib/DAL/postgres.dal';
import { MssqlDAL } from '../lib/DAL/mssql.dal';

export class InternalConfigManager {
  private client!: MySQLConnection | PostgresConnection | MSSQLConnection;
  private clientRepository!: MysqlRepository | PostgresRepository | MssqlRepository;
  private clientDAL!: MysqlDAL | PostgresDAL | MssqlDAL;
  private static instance: InternalConfigManager;

  constructor() {}

  public static getInstance() {
    if (!InternalConfigManager.instance) {
      InternalConfigManager.instance = new InternalConfigManager();
    }

    return InternalConfigManager.instance as InternalConfigManager;
  }

  public setClientDB(client: MySQLConnection | PostgresConnection | MSSQLConnection) {
    this.client = client;
  }

  public getCLientDB(): MySQLConnection | PostgresConnection | MSSQLConnection {
    return this.client;
  }

  public setClientDBRepository(
    clientRepository: MysqlRepository | PostgresRepository | MssqlRepository
  ) {
    this.clientRepository = clientRepository;
  }

  public getCLientDBRepository(): MysqlRepository | PostgresRepository | MssqlRepository {
    return this.clientRepository;
  }

  public setClientDAL(clientDAL: MysqlDAL | PostgresDAL | MssqlDAL) {
    return (this.clientDAL = clientDAL);
  }

  public getClientDAL(): MysqlDAL | PostgresDAL | MssqlDAL {
    return this.clientDAL;
  }
}
