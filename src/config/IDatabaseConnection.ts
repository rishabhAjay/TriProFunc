/**
 * @interface IDatabaseConnection
 * @description This interface represents the structure of an abstract class for a database connection.
 * It defines the required properties and methods that any implementing class must follow.
 */
export interface IDatabaseConnection {
  /**
   * @function connect
   * @description Initates a connection to the DB
   * @returns {string} - A promise of connection start
   *
   */
  connect(): Promise<any>;

  /**
   * @function disconnect
   * @description Initates a disconnection from the DB
   *
   */
  disconnect(): Promise<void>;
}
