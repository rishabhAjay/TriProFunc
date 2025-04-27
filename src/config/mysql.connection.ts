import { Connection, ConnectionOptions } from 'mysql2/promise';
import { getConfigManager } from '../config/config.context';
import mysql from 'mysql2/promise';
import { IDatabaseConnection } from './IDatabaseConnection';

export class MySQLConnection implements IDatabaseConnection {
  private connection: Connection | null = null;

  async connect() {
    const { ...allProps } = getConfigManager().getConfig() as ConnectionOptions;
    if (!this.connection) {
      this.connection = await mysql.createConnection({
        ...allProps,
      });
    }
    return this.connection;
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }
}
