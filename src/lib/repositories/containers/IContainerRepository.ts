import { StartedMSSQLServerContainer } from '@testcontainers/mssqlserver';
import { StartedMySqlContainer } from '@testcontainers/mysql';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { ConnectionPool } from 'mssql';
import { Connection } from 'mysql2/promise';
import { Client } from 'pg';

/**
 * @interface IContainerRepository
 * @description This interface represents the structure of an abstract class for a container repository.
 * It defines the required properties and methods that any implementing class must follow.
 */
export interface IContainerRepository {
  /**
   * @function initializeContainer
   * @description Initialize and start a DB container
   * @returns {Promise<StartedMySqlContainer | StartedPostgreSqlContainer  | StartedMSSQLServerContainer>}
   * A promise that returns the container start result
   *
   */
  initializeContainer(): Promise<
    StartedMySqlContainer | StartedPostgreSqlContainer | StartedMSSQLServerContainer
  >;

  /**
   * @function connectToContainer
   * @description Connect to the DB of the container
   * @param {StartedMySqlContainer | StartedPostgreSqlContainer  | StartedMSSQLServerContainer} container -
   * the metadata of the started DB container
   * @returns {Promise<Connection | Client | ConnectionPool>} -
   * A promise that returns the connection details of the DB container
   *
   */
  connectToContainer(
    container: StartedMySqlContainer | StartedPostgreSqlContainer | StartedMSSQLServerContainer
  ): Promise<Connection | Client | ConnectionPool>;

  /**
   * @function disconnectFromContainer
   * @description disconnect from the DB of the container
   * @param {Connection | Client | ConnectionPool} containerClient - the connection of the container DB
   * @returns {Promise<any>} - disconnection
   *
   */
  disconnectFromContainer(containerClient: Connection | Client | ConnectionPool): Promise<any>;

  /**
   * @function stopContainer
   * @description Stop the container
   * @param {StartedMySqlContainer | StartedPostgreSqlContainer  | StartedMSSQLServerContainer} container -
   * The container metadata
   * @returns {Promise<any>} - Promise to stop the container
   *
   */
  stopContainer(
    container: StartedMySqlContainer | StartedPostgreSqlContainer | StartedMSSQLServerContainer
  ): Promise<any>;
}
