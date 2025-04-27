import { IResult, Request, Transaction } from 'mssql';
import { FieldPacket, QueryResult as MysqlQueryResult } from 'mysql2/promise';
import { QueryResult as PostgresQueryResult } from 'pg';

/**
 * @interface IDBRepository
 * @description This interface represents the structure of an abstract class for a repository.
 * It defines the required properties and methods that any implementing class must follow.
 */
export interface IDBRepository {
  /**
   * @function getEngineVersion
   * @description Returns the engine version of the Database. Required for spinning up a container
   * @returns {Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult<any> | IResult<any>>}
   * A promise of the query result
   *
   */
  getEngineVersion(): Promise<
    [MysqlQueryResult, FieldPacket[]] | PostgresQueryResult<any> | IResult<any>
  >;

  /**
   * @function getProcedureCodeFromName
   * @param {string} procedureName - Name of the procedure to get source code of
   * @description Returns the source code of the given procedure
   * @returns {Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult<any> | IResult<any>>}
   * A promise of the query result
   *
   */
  getProcedureCodeFromName(
    procedureName: string
  ): Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult<any> | IResult<any>>;

  /**
   * @function getTriggerCodeFromName
   * @param {string} triggerName - Name of the trigger to get source code of
   * @param {string} [tableName] - Name of the table that the trigger is associated with(optional)
   * @description Returns the source code of the given trigger
   * @returns {Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult<any> | IResult<any>>}
   * A promise of the query result
   *
   */
  getTriggerCodeFromName(
    triggerName: string,
    tableName?: string
  ): Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | IResult<any>>;

  /**
   * @function getFunctionCodeFromName
   * @param {string} functionName - Name of the function to get source code of
   * @description Returns the source code of the given function
   * @returns {Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult<any> | IResult<any>>}
   * A promise of the query result
   *
   */
  getFunctionCodeFromName(
    functionName: string
  ): Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | IResult<any>>;

  /**
   * @function getTableDDL
   * @param {string} tableName - Name of the table to get DDL of
   * @description Returns the DDL of the given table
   * @returns {Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult<any> | IResult<any>>}
   * A promise of the query result
   *
   */
  getTableDDL(
    tableName: string
  ): Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | IResult<any>>;

  /**
   * @function generateDropTriggerStatement
   * @param {string} triggerName: Name of the trigger to generate drop statement for
   * @param {string} [tableName] - Name of the table to get DDL of(optional)
   * @param {string} [includeDrop] - Whether to include the drop or not
   * @description Returns the DDL of the given table
   * @returns {string}
   * An sql query of the drop trigger statement
   *
   */
  generateDropStatement(
    triggerName: string,
    type: 'trigger' | 'function' | 'procedure',
    tableName?: string,
    includeDrop?: boolean
  ): string;

  /**
   * @function createTempTable
   * @param {string} tableName - Name of the temp table to create
   * @description Creates a dummy table given the name
   * @returns {Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | IResult<any>>}
   * A promise of the query result
   *
   */
  createTempTable(
    tableName: string
  ): Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | IResult<any>>;

  /**
   * @function createTempFunction
   * @param {string} functionName - Name of the function to create
   * @description Creates a dummy function given the name
   * @returns {Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | IResult<any>>}
   * A promise of the query result
   *
   */
  createTempFunction(
    functionName: string
  ): Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | IResult<any>>;

  /**
   * @function listAllProcedures
   * @description Lists all the procedures in the DB with their source code
   * @returns {Promise<any | PostgresQueryResult | IResult<any>>}
   * A promise of the query result
   *
   */
  listAllProcedures(): Promise<any | PostgresQueryResult | IResult<any>>;

  /**
   * @function listAllFunctions
   * @description Lists all the functions in the DB with their source code
   * @returns {Promise<any | PostgresQueryResult | IResult<any>>}
   * A promise of the query result
   *
   */
  listAllFunctions(): Promise<any | PostgresQueryResult | IResult<any>>;

  /**
   * @function listAllTriggers
   * @description Lists all the triggers in the DB with their source code
   * @returns {Promise<any | PostgresQueryResult | IResult<any>>}
   * A promise of the query result
   *
   */
  listAllTriggers(): Promise<any | PostgresQueryResult | IResult<any>>;

  /**
   * @function createMigrationsTable
   * @param {string} migrationsTableName - Name of the migration table to create
   * @description Creates a migration table if it does not exist
   * @returns {Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | IResult<any>>}
   * A promise of the query result
   *
   */
  createMigrationsTable(
    migrationsTableName: string,
    request?: Request
  ): Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | IResult<any>>;

  /**
   * @function getPendingMigrations
   * @param {string[]} arrayOfMigrations - Array of migration names that are potentially pending
   * @param {string} migrationsTableName - Name of the migration table to look into
   * @description Returns all the pending migrations from the given array of migration names
   * @returns {Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | IResult<any>>}
   * A promise of the query result
   *
   */
  getPendingMigrations(
    arrayOfMigrations: string[],
    migrationsTableName: string
  ): Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | IResult<any>>;

  /**
   * @function getLastRunMigration
   * @param {string} migrationsTableName - Name of the migration table to look into
   * @description Returns the latest run migration
   * @returns {Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | IResult<any>>}
   * A promise of the query result
   *
   */
  getLastRunMigration(
    migrationsTableName: string
  ): Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | IResult<any>>;

  /**
   * @function startTransaction
   * @description Starts a transaction
   * @returns {Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | { request: Request; transaction: Transaction; }>}
   * A promise of the query result
   *
   */
  startTransaction(): Promise<
    | [MysqlQueryResult, FieldPacket[]]
    | PostgresQueryResult
    | { request: Request; transaction: Transaction }
  >;

  /**
   * @function commitTransaction
   * @description Commits a transaction
   * @returns {Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | void>}
   * A promise of the query result
   *
   */
  commitTransaction(
    transaction?: Transaction
  ): Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | void>;

  /**
   * @function rollbackTransaction
   * @description Rolls back a transaction
   * @returns {Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | void>}
   * A promise of the query result
   *
   */
  rollbackTransaction(
    transaction?: Transaction
  ): Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | void>;

  /**
   * @function runInputQueries
   * @param {string} sql: the SQL queries to run
   * @param {string} request: The request object of the transaction block(MSSQL Only)
   * @description Runs all the provided SQL queries
   * @returns {Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult |  void>}
   * A promise of the query result
   *
   */
  runInputQueries(
    sql: string,
    request?: Request
  ): Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | void>;

  /**
   * @function insertIntoMigrationTable
   * @param {string} migrationsTable: the name of the migration table to look into
   * @param {string} filename: the name of the migration/file to insert
   * @param {number} timestamp: the timestamp at which the migration was run
   * @param {string} request: The request object of the transaction block(MSSQL Only)
   * @description Inserts a record into the migration table for the migration that just ran
   * @returns {Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | IResult<any>>}
   * A promise of the query result
   *
   */
  insertIntoMigrationTable(
    migrationsTable: string,
    filename: string,
    timestamp: number,
    request?: Request
  ): Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | IResult<any>>;

  /**
   * @function deleteFromMigrationTable
   * @param {string} migrationsTable: the name of the migration table to look into
   * @param {string} lastRunMigration: the name of the migration record to remove
   * @param {string} request: The request object of the transaction block(MSSQL Only)
   * @description Removes the last run migration record off from the migration table
   * @returns {Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | IResult<any>>}
   * A promise of the query result
   *
   */
  deleteFromMigrationTable(
    migrationsTable: string,
    lastRunMigration: string,
    request?: Request
  ): Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | IResult<any>>;

  /**
   * @function closeConnection
   * @description Closes the DB connection for cleanup
   * @returns {Promise<void | IResult<any>>}
   * A promise of the connection close
   *
   */
  closeConnection(): Promise<void | IResult<any>>;

  /**
   * @function escapeIdentifier
   * @param {string} name: name of the identifier to escape
   * @description Helps with identifier escaping
   * @returns {string}
   * An escaped identifier
   *
   */
  escapeIdentifier(name: string): string;

  /**
   * @function preloadUtilities
   * @description Loads all utility functions and procedures
   * @returns { Promise<[MysqlQueryResult, FieldPacket[]] | PostgresQueryResult | IResult<any>> | void}
   * Finishes Loading the utilities
   *
   */
  preloadUtilities(): Promise<
    [MysqlQueryResult, FieldPacket[]][] | PostgresQueryResult | IResult<any>
  > | void;
}
