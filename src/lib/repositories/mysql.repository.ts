//let cleanedSql = createFunctionSql.replace(/^CREATE DEFINER=`[^`]+`@`[^`]+` /, 'CREATE ');

import { Connection, ConnectionOptions } from 'mysql2/promise';
import { IDBRepository } from './IDBRepository';
import { getConfigManager } from '../../config/config.context';
export class MysqlRepository implements IDBRepository {
  private readonly configOptions: ConnectionOptions;
  constructor(private readonly mysqlClient: Connection) {
    this.configOptions = getConfigManager().getConfig() as ConnectionOptions;
  }

  getEngineVersion() {
    return this.mysqlClient.query(`SELECT VERSION() as server_version;`);
  }

  async getProcedureCodeFromName(procedureName: string) {
    return this.mysqlClient.query(`show create procedure ??;`, [procedureName]);
  }

  async getTriggerCodeFromName(triggerName: string) {
    return this.mysqlClient.query(`show create trigger ??;`, [triggerName]);
  }

  async getFunctionCodeFromName(functionName: string) {
    return this.mysqlClient.query(`show create function ??;`, [functionName]);
  }

  async getTableDDL(tableName: string) {
    return this.mysqlClient.query(`show create table ??;`, [tableName]);
  }

  generateDropStatement(objectName: string, type: 'trigger' | 'function' | 'procedure') {
    if (!['trigger', 'function', 'procedure'].includes(type)) {
      throw new Error('Invalid SQL object type');
    }
    return `DROP ${type.toUpperCase()} IF EXISTS ${objectName};`;
  }

  async createTempTable(tableName: string) {
    return this.mysqlClient.query(
      `
      CREATE TABLE IF NOT EXISTS ?? (id SERIAL PRIMARY KEY);`,
      [`${tableName}`]
    );
  }

  async createTempFunction(functionName: string) {
    return this.mysqlClient.query(
      `
      CREATE OR REPLACE FUNCTION ??() RETURNS trigger AS $$
        BEGIN
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `,
      [`${functionName}`]
    );
  }

  async listAllFunctions() {
    const [results]: [any[], any[]] = await this.mysqlClient.query(
      `SELECT ROUTINE_NAME as funname
  FROM INFORMATION_SCHEMA.ROUTINES
  WHERE ROUTINE_TYPE = 'FUNCTION'
  AND ROUTINE_SCHEMA = ?;`,
      [this.configOptions.database]
    );

    return Promise.all([
      results.map(async (functionDef) => {
        const [results2]: [any[], any[]] = await this.mysqlClient.query(
          `SHOW CREATE FUNCTION ??;`,
          [functionDef.funname]
        );

        return {
          type: 'function',
          funname: functionDef.funname,
          funsrc: results2[0]['Create Function'],
        };
      }),
    ]);
  }

  async listAllProcedures() {
    const [results]: [any[], any[]] = await this.mysqlClient.query(
      `SELECT ROUTINE_NAME as procname
  FROM INFORMATION_SCHEMA.ROUTINES
  WHERE ROUTINE_TYPE = 'PROCEDURE'
  AND ROUTINE_SCHEMA = ?;`,
      [this.configOptions.database]
    );

    return Promise.all([
      results.map(async (procedure) => {
        const [results2]: [any[], any[]] = await this.mysqlClient.query(
          `SHOW CREATE PROCEDURE ??;`,
          [procedure.procname]
        );

        return {
          type: 'procedure',
          procname: procedure.procname,
          procsrc: results2[0]['Create Procedure'],
        };
      }),
    ]);
  }

  async listAllTriggers() {
    const [results]: [any[], any[]] = await this.mysqlClient.query(
      `SELECT TRIGGER_NAME as trigname
  FROM INFORMATION_SCHEMA.TRIGGERS
  WHERE TRIGGER_SCHEMA = ?;`,
      [this.configOptions.database]
    );

    return Promise.all([
      results.map(async (triggerDef) => {
        const [results2]: [any[], any[]] = await this.mysqlClient.query(`show create trigger ??;`, [
          triggerDef.trigname,
        ]);

        return {
          type: 'trigger',
          trigname: triggerDef.trigname,
          trigsrc: results2[0]['SQL Original Statement'],
        };
      }),
    ]);
  }

  async createMigrationsTable(migrationsTableName: string) {
    return this.mysqlClient.query(
      `create table if not exists ?? (
            id SERIAL not null primary key,
            migration_name varchar(400) not null,
            migration_timestamp BIGINT not null,
            unique (migration_name));`,
      [migrationsTableName]
    );
  }

  async getPendingMigrations(arrayOfMigrations: string[], migrationsTableName: string) {
    return this.mysqlClient.query(
      `SELECT pending_migration
      FROM (
        ${arrayOfMigrations.map(() => 'SELECT ? AS pending_migration').join(' UNION ALL ')}
      ) AS arr
      WHERE NOT EXISTS (
        SELECT 1 FROM ?? f WHERE f.migration_name = arr.pending_migration
      ) ORDER BY pending_migration ASC;`,
      [...arrayOfMigrations, migrationsTableName]
    );
  }

  async getLastRunMigration(migrationsTableName: string) {
    return this.mysqlClient.query(
      `
            SELECT migration_name
            FROM ??
            ORDER BY migration_timestamp DESC limit 1;
          `,
      [migrationsTableName]
    );
  }

  async startTransaction() {
    return this.mysqlClient.query('START TRANSACTION;');
  }

  async commitTransaction() {
    return this.mysqlClient.query('COMMIT;');
  }

  async rollbackTransaction() {
    return this.mysqlClient.query('ROLLBACK;');
  }

  async runInputQueries(sql: string) {
    return this.mysqlClient.query(sql);
  }

  async insertIntoMigrationTable(migrationsTable: string, filename: string, timestamp: number) {
    return this.mysqlClient.query(
      `INSERT INTO ??(migration_name, migration_timestamp) VALUES (?, ?)`,
      [migrationsTable, filename, timestamp]
    );
  }

  async deleteFromMigrationTable(migrationsTable: string, lastRunMigration: string) {
    return this.mysqlClient.query(`DELETE FROM ?? WHERE migration_name = ?`, [
      migrationsTable,
      lastRunMigration,
    ]);
  }

  async closeConnection() {
    return this.mysqlClient.end();
  }

  escapeIdentifier(name: string) {
    if (typeof name !== 'string') {
      throw new Error('Identifier must be a string');
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_\-]*$/.test(name)) {
      throw new Error(`Invalid identifier: ${name}`);
    }

    return name;
  }
}
