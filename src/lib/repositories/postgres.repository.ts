import { Client } from 'pg';
import { IDBRepository } from './IDBRepository';

export class PostgresRepository implements IDBRepository {
  constructor(private readonly postgresClient: Client) {}

  getEngineVersion() {
    return this.postgresClient.query(`SHOW server_version;`);
  }

  async getProcedureCodeFromName(procedureName: string) {
    return this.postgresClient.query(
      `SELECT
        pg_get_functiondef((
            SELECT
                oid FROM pg_proc
            WHERE
                proname = $1)) as prosrc;`,
      [procedureName]
    );
  }

  async getTriggerCodeFromName(triggerName: string, tableName?: string) {
    if (tableName) {
      return this.postgresClient.query(
        `select
          pg_get_triggerdef(t.oid) as trigsrc
        from
          pg_trigger t
        join pg_class c on t.tgrelid = c.oid
        where
          c.relname = $1 and
          t.tgname = $2 and
          not t.tgisinternal;`,
        [tableName, triggerName]
      );
    } else
      return this.postgresClient.query(
        `select
        pg_get_triggerdef(t.oid) as trigsrc
      from
        pg_trigger t
      where
        t.tgname = $1
        and not t.tgisinternal;`,
        [triggerName]
      );
  }

  async getFunctionCodeFromName(functionName: string) {
    return this.postgresClient.query(
      `select
        pg_catalog.pg_get_functiondef(p.oid) as funsrc
      from
        pg_catalog.pg_proc p
      where
        p.proname = $1
        and pg_catalog.pg_function_is_visible(p.oid);`,
      [functionName]
    );
  }

  async createTempTable(tableName: string) {
    const formattedQueryString = await this.postgresClient.query(
      `SELECT FORMAT('CREATE TABLE IF NOT EXISTS %I (id SERIAL PRIMARY KEY);')`,
      [tableName]
    );
    return this.postgresClient.query(formattedQueryString.rows[0]);
  }

  async getTableDDL(tableName: string) {
    await this.postgresClient
      .query(`CREATE OR REPLACE FUNCTION generate_create_table_statement(p_table_name varchar)
  RETURNS text AS
$BODY$
DECLARE
    v_table_ddl   text;
    column_record record;
BEGIN
    FOR column_record IN 
        SELECT 
            b.nspname as schema_name,
            b.relname as table_name,
            a.attname as column_name,
            pg_catalog.format_type(a.atttypid, a.atttypmod) as column_type,
            CASE WHEN 
                (SELECT substring(pg_catalog.pg_get_expr(d.adbin, d.adrelid) for 128)
                 FROM pg_catalog.pg_attrdef d
                 WHERE d.adrelid = a.attrelid AND d.adnum = a.attnum AND a.atthasdef) IS NOT NULL THEN
                'DEFAULT '|| (SELECT substring(pg_catalog.pg_get_expr(d.adbin, d.adrelid) for 128)
                              FROM pg_catalog.pg_attrdef d
                              WHERE d.adrelid = a.attrelid AND d.adnum = a.attnum AND a.atthasdef)
            ELSE
                ''
            END as column_default_value,
            CASE WHEN a.attnotnull = true THEN 
                'NOT NULL'
            ELSE
                'NULL'
            END as column_not_null,
            a.attnum as attnum,
            e.max_attnum as max_attnum
        FROM 
            pg_catalog.pg_attribute a
            INNER JOIN 
             (SELECT c.oid,
                n.nspname,
                c.relname
              FROM pg_catalog.pg_class c
                   LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
              WHERE c.relname ~ ('^('||p_table_name||')$')
                AND pg_catalog.pg_table_is_visible(c.oid)
              ORDER BY 2, 3) b
            ON a.attrelid = b.oid
            INNER JOIN 
             (SELECT 
                  a.attrelid,
                  max(a.attnum) as max_attnum
              FROM pg_catalog.pg_attribute a
              WHERE a.attnum > 0 
                AND NOT a.attisdropped
              GROUP BY a.attrelid) e
            ON a.attrelid=e.attrelid
        WHERE a.attnum > 0 
          AND NOT a.attisdropped
        ORDER BY a.attnum
    LOOP
        IF column_record.attnum = 1 THEN
            v_table_ddl:='CREATE TABLE '||column_record.schema_name||'.'||column_record.table_name||' (';
        ELSE
            v_table_ddl:=v_table_ddl||',';
        END IF;

        IF column_record.attnum <= column_record.max_attnum THEN
            v_table_ddl:=v_table_ddl||chr(10)||
                     '    '||column_record.column_name||' '||column_record.column_type||' '||column_record.column_default_value||' '||column_record.column_not_null;
        END IF;
    END LOOP;

    v_table_ddl:=v_table_ddl||');';
    RETURN v_table_ddl;
END;
$BODY$
  LANGUAGE 'plpgsql' COST 100.0 SECURITY INVOKER;`);
    return this.postgresClient.query(`SELECT generate_create_table_statement($1) as tabledef;`, [
      tableName,
    ]);
  }

  generateDropStatement(objectName: string, type: 'trigger', tableName?: string) {
    if (!['trigger'].includes(type)) {
      return '';
    }
    return `DROP ${type.toUpperCase()} IF EXISTS ${objectName}${tableName ? ` ON ${tableName}` : ''};`;
  }
  async createTempFunction(functionName: string) {
    return this.postgresClient.query(`
      CREATE OR REPLACE FUNCTION ${functionName}() RETURNS trigger AS $$
        BEGIN
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);
  }

  async listAllProcedures() {
    return this.postgresClient.query(`SELECT 
            'procedure' type,
            p.proname AS procname,
          pg_get_functiondef(p.oid) as procsrc
        FROM 
            pg_catalog.pg_proc p
            LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        WHERE 
            n.nspname <> 'pg_catalog' 
            AND n.nspname <> 'information_schema'
            AND p.prokind = 'p'  -- Filter only procedures
        ORDER BY 1, 2;
        `);
  }

  async listAllFunctions() {
    return this.postgresClient.query(`SELECT 
            'function' type,
            p.proname AS funname,
            pg_catalog.pg_get_functiondef(p.oid) as funsrc
        FROM 
            pg_catalog.pg_proc p
            LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        WHERE 
            n.nspname <> 'pg_catalog' 
            AND n.nspname <> 'information_schema'
            AND p.prokind = 'f'  -- Filter only functions
        ORDER BY 1, 2;
        `);
  }

  async listAllTriggers() {
    return this.postgresClient.query(`SELECT 
            'trigger' type,
            tgname as trigname,
            pg_catalog.pg_get_triggerdef(t.oid) AS trigsrc
        FROM 
            pg_catalog.pg_trigger t
            JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
            LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE 
            NOT t.tgisinternal  -- Exclude internal triggers
            AND n.nspname <> 'pg_catalog' 
            AND n.nspname <> 'information_schema'
        ORDER BY 1, 2;`);
  }

  async createMigrationsTable(migrationsTableName: string) {
    return this.postgresClient.query(`create table if not exists ${migrationsTableName} (
            id SERIAL not null primary key,
            migration_name text not null,
            migration_timestamp BIGINT not null,
            unique (migration_name));`);
  }

  async getPendingMigrations(arrayOfMigrations: string[], migrationsTableName: string) {
    return this.postgresClient.query(
      `
            SELECT unnest($1::text[]) AS pending_migration
            EXCEPT
            SELECT migration_name
            FROM ${migrationsTableName}
            ORDER BY pending_migration ASC;
          `,
      [arrayOfMigrations]
    );
  }

  async getLastRunMigration(migrationsTableName: string) {
    return this.postgresClient.query(
      `
            SELECT migration_name
            FROM ${migrationsTableName}
            ORDER BY migration_timestamp DESC limit 1;
          `
    );
  }

  async startTransaction() {
    return this.postgresClient.query('START TRANSACTION;');
  }

  async commitTransaction() {
    return this.postgresClient.query('COMMIT;');
  }

  async rollbackTransaction() {
    return this.postgresClient.query('ROLLBACK;');
  }

  async runInputQueries(sql: string) {
    return this.postgresClient.query(sql);
  }

  async insertIntoMigrationTable(migrationsTable: string, filename: string, timestamp: number) {
    return this.postgresClient.query(
      `INSERT INTO ${migrationsTable}(migration_name, migration_timestamp) VALUES ($1, $2)`,
      [filename, timestamp]
    );
  }

  async deleteFromMigrationTable(migrationsTable: string, lastRunMigration: string) {
    return this.postgresClient.query(`DELETE FROM ${migrationsTable} WHERE migration_name = $1`, [
      lastRunMigration,
    ]);
  }

  async closeConnection() {
    return this.postgresClient.end();
  }

  escapeIdentifier(name: string) {
    if (typeof name !== 'string') {
      throw new Error('Identifier must be a string');
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_\-]*$/.test(name)) {
      throw new Error(`Invalid identifier: ${name}`);
    }

    return `"${name.replace(/"/g, '""')}"`;
  }
}
