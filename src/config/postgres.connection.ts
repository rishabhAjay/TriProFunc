import { Client, ClientConfig } from 'pg';
import { getConfigManager } from '../config/config.context';
import { IDatabaseConnection } from './IDatabaseConnection';

export class PostgresConnection implements IDatabaseConnection {
  private client: Client | null = null;

  async connect() {
    const { ...allProps } = getConfigManager().getConfig() as ClientConfig;
    if (!this.client) {
      this.client = new Client({
        ...allProps,
      });
      await this.client.connect();
    }
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }
}
