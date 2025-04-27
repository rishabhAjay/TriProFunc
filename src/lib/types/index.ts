import { ClientConfig } from 'pg';

import { ConnectionOptions } from 'mysql2';
import { config } from 'mssql';

export type DbEngineMapping =
  | ({ engine: 'postgres' } & ClientConfig)
  | ({ engine: 'mysql' } & ConnectionOptions)
  | ({ engine: 'mssql' } & config);

export type DbEngines = DbEngineMapping['engine'];

/**
 * User Defined Configuration Options
 */
export interface ConfigOptions {
  /**
   * The directory of all your procedures
   */
  proceduresDirectory?: string;
  /**
   * The directory of all your triggers
   */
  triggersDirectory?: string;
  /**
   * The directory of all your functions
   */
  functionsDirectory?: string;
  /**
   * The directory where your migrations would be present
   */
  migrationsDirectory?: string;
  /**
   * The name of the DB table for keeping track of migrations
   */
  migrationsTable?: string;
  /**
   * The type of SQL database
   */
  engine: DbEngines;
}

export type TriProFuncConfig = ConfigOptions &
  (
    | ({
        engine: 'postgres';
      } & ClientConfig)
    | ({
        engine: 'mysql';
      } & ConnectionOptions)
    | ({
        engine: 'mssql';
      } & config)
  );
