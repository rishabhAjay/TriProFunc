import { getConfigManager } from '../config/config.context';
import mssql, { ConnectionPool } from 'mssql';
import { IDatabaseConnection } from './IDatabaseConnection';

export class MSSQLConnection implements IDatabaseConnection {
  private connection: mssql.ConnectionPool | null = null;

  async connect() {
    const { ...allProps } = getConfigManager().getConfig() as mssql.config;
    if (!this.connection) {
      this.connection = new ConnectionPool({
        ...allProps,
      });
      await this.connection.connect();
    }
    return this.connection;
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }
}
