//let cleanedSql = createFunctionSql.replace(/^CREATE DEFINER=`[^`]+`@`[^`]+` /, 'CREATE ');

import { IDBRepository } from './IDBRepository';
import { ConnectionPool, Request, Transaction } from 'mssql';

export class MssqlRepository implements IDBRepository {
  constructor(private readonly mssqlClient: ConnectionPool) {}

  getEngineVersion() {
    return this.mssqlClient.query`SELECT CASE 
        WHEN LEFT(CONVERT(VARCHAR, SERVERPROPERTY('ProductVersion')), 2) = '15' THEN '2019'
        WHEN LEFT(CONVERT(VARCHAR, SERVERPROPERTY('ProductVersion')), 2) = '14' THEN '2017'
        ELSE '2022'
    END AS server_version;`;
  }

  async getProcedureCodeFromName(procedureName: string) {
    return this.mssqlClient.query`SELECT OBJECT_DEFINITION(OBJECT_ID(${
      'dbo.' + procedureName
    })) AS prosrc;`;
  }

  async getTriggerCodeFromName(triggerName: string) {
    return this.mssqlClient.query`SELECT 
    OBJECT_DEFINITION(t.object_id) AS trigsrc
FROM 
    sys.triggers t
WHERE 
    t.name =${triggerName}`;
  }

  async getFunctionCodeFromName(functionName: string) {
    return this.mssqlClient.query`SELECT OBJECT_DEFINITION(OBJECT_ID(${
      'dbo.' + functionName
    })) AS funsrc;`;
  }

  async getTableDDL(tableName: string) {
    //SQL server does not support fetching a DDL yet so gotta do this
    return this.mssqlClient.query`DECLARE @tableName NVARCHAR(128) = ${tableName};
                          -- Generate basic CREATE TABLE statement
                          DECLARE @sql NVARCHAR(MAX) = 'CREATE TABLE ' + @tableName + ' (';

                          -- Add column definitions
                          SELECT @sql = @sql + CHAR(13) + '    ' + c.name + ' ' + 
                                          t.name + 
                                          CASE 
                                              WHEN c.is_nullable = 0 THEN ' NOT NULL'
                                              ELSE ' NULL'
                                          END + ',' 
                          FROM sys.columns c
                          JOIN sys.types t ON c.user_type_id = t.user_type_id
                          WHERE c.object_id = OBJECT_ID(@tableName);

                          -- Remove last comma and add closing parenthesis
                          SET @sql = LEFT(@sql, LEN(@sql) - 1) + CHAR(13) + ');';

                          -- Output the CREATE TABLE script
                          SELECT @sql as tabledef;`;
  }

  generateDropStatement(objectName: string, type: 'trigger' | 'function' | 'procedure') {
    if (!['trigger', 'function', 'procedure'].includes(type)) {
      throw new Error('Invalid SQL object type');
    }
    return `DROP ${type.toUpperCase()} IF EXISTS ${objectName};` + '\n' + 'GO;';
  }

  async createTempTable(tableName: string) {
    return this.mssqlClient.query`CREATE TABLE IF NOT EXISTS ${tableName} (id SERIAL PRIMARY KEY);`;
  }

  async createTempFunction(functionName: string) {
    return this.mssqlClient.request().query(`CREATE FUNCTION dbo.${functionName}()
                                      RETURNS INT
                                      AS
                                      BEGIN
                                          RETURN 42;  -- Just returns a static integer
                                      END;
    `);
  }

  async listAllFunctions() {
    return this.mssqlClient.query`SELECT
    o.name AS funname,
    'function' AS type,
    sm.definition AS funsrc
FROM
    sys.objects o
JOIN
    sys.sql_modules sm
    ON o.object_id = sm.object_id
WHERE
    o.type IN ('FN', 'IF', 'TF', 'FS', 'FT')  -- FN = Scalar Functions, IF = In-line Table-Valued Functions, TF = Table-Valued Functions, FS = Assembly Functions, FT = Assembly Table-Valued Functions
    AND o.is_ms_shipped = 0  -- Exclude system functions
ORDER BY
    o.name;`;
  }

  async listAllProcedures() {
    return this.mssqlClient.query`SELECT
    o.name AS procname,
    'procedure' AS type,
    sm.definition AS procsrc
FROM
    sys.objects o
JOIN
    sys.sql_modules sm
    ON o.object_id = sm.object_id
WHERE
    o.type = 'P'  -- 'P' represents stored procedures
    AND o.is_ms_shipped = 0  -- Exclude system procedures
ORDER BY
    o.name;
`;
  }

  async listAllTriggers() {
    return this.mssqlClient.query`SELECT
    t.name AS trigname,
    'trigger' AS type,
    OBJECT_DEFINITION(t.object_id) AS trigsrc
FROM
    sys.triggers t
WHERE
    t.is_ms_shipped = 0  -- Exclude system triggers
ORDER BY
    t.name`;
  }

  async createMigrationsTable(migrationsTableName: string, request?: Request) {
    const query = `IF NOT EXISTS (
    SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.${migrationsTableName}') AND type = 'U'
) BEGIN
create table ${migrationsTableName} (
            id int identity(1,1) primary key,
            migration_name varchar(400) not null,
            migration_timestamp BIGINT not null,
            unique (migration_name)) END;`;
    return (request ? request : this.mssqlClient.request()).query(query);
  }

  async getPendingMigrations(arrayOfMigrations: string[], migrationsTableName: string) {
    const migrationValues = arrayOfMigrations.map((migration) => `('${migration}')`).join(', ');

    const query = `
        SELECT migration as pending_migration FROM (VALUES ${migrationValues}) AS InputList(migration)
        EXCEPT
        SELECT migration_name FROM ${migrationsTableName};
      `;

    return this.mssqlClient.request().query(query);
  }

  async getLastRunMigration(migrationsTableName: string) {
    return this.mssqlClient.request().query(`
            SELECT TOP 1 migration_name
            FROM ${migrationsTableName}
            ORDER BY migration_timestamp DESC;
          `);
  }

  async startTransaction() {
    const transaction = new Transaction(this.mssqlClient); // ensures same connection
    await transaction.begin();
    return { request: new Request(transaction), transaction };
  }

  async commitTransaction(transaction: Transaction) {
    return transaction.commit();
  }

  async rollbackTransaction(transaction: Transaction) {
    return transaction.rollback();
  }

  async runInputQueries(sql: string, request?: Request) {
    const batches = sql.split('GO;');
    await Promise.all(
      batches.map((batch) => {
        return (request ? request : this.mssqlClient.request()).query(batch);
      })
    );
    return;
  }

  async insertIntoMigrationTable(
    migrationsTable: string,
    filename: string,
    timestamp: number,
    request?: Request
  ) {
    return (request ? request : this.mssqlClient.request())
      .input('filename', filename)
      .input('timestamp', timestamp)
      .query(
        `INSERT INTO ${migrationsTable}(migration_name, migration_timestamp) VALUES (@filename, @timestamp)`
      );
  }

  async deleteFromMigrationTable(
    migrationsTable: string,
    lastRunMigration: string,
    request?: Request
  ) {
    return (request ? request : this.mssqlClient.request())
      .input('lastRunMigration', lastRunMigration)
      .query(`DELETE FROM ${migrationsTable} WHERE migration_name = @lastRunMigration`);
  }

  async closeConnection() {
    return this.mssqlClient.close();
  }

  escapeIdentifier(name: string) {
    if (typeof name !== 'string') {
      throw new Error('Identifier must be a string');
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_\-]*$/.test(name)) {
      throw new Error(`Invalid identifier: ${name}`);
    }

    return `[${name.replace(/]/g, ']]')}]`;
  }
}

// case 'mysql':
//   return `\`${name.replace(/`/g, '``')}\``; // backticks for MySQL

// case 'mssql':
//   return `[${name.replace(/]/g, ']]')}]`; // square brackets for MSSQL
