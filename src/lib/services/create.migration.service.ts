import PromisePool from '@supercharge/promise-pool';
import {
  extractFunctionName,
  extractTableName,
  getFilesWithDirectories,
} from '../../utils/sql.utils';

import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';
import { readFile } from 'fs/promises';
import { compareHashesFromStrings } from '../../utils/hash.utils';
import {
  appendToMigrationFilesInMemory,
  createDirectoryIfNotExists,
  createMigrationUpAndDownFilesInMemory,
  writeCombinedMigrationFileToDisk,
} from '../../utils/file.utils';
import { StartedMySqlContainer } from '@testcontainers/mysql';
import { Connection } from 'mysql2/promise';
import { DBRepositoryFactory } from '../repositories/db.repository.factory';
import { IContainerRepository } from '../repositories/containers/IContainerRepository';
import { IDBRepository } from '../repositories/IDBRepository';
import { IDAL } from '../DAL/IDAL';
import { ConnectionPool } from 'mssql';
import { StartedMSSQLServerContainer } from '@testcontainers/mssqlserver';
import { LoggingService } from './logging.service';
import { getConfigManager } from '../../config/config.context';
/**
 * Service responsible for Creating a migration with new changes present in the source files.
 * This service provides methods for to run the command via commander.
 */
export class CreateMigrationService {
  /**
   *@constructor
   *
   * @param {IDAL} injectDAL - Inject the data access layer for generalizing object handling and manipulation
   * @param {IDBRepository} injectRepository - Inject the repository based on the selected DB engine
   * @param {IContainerRepository} injectContainerRepository - Inject the container repository based on the selected DB engine
   * @param {LoggingService} logger - Inject the logger service
   */
  constructor(
    private readonly injectDAL: IDAL,
    private readonly injectRepository: IDBRepository,
    private readonly injectContainerRepository: IContainerRepository,
    private readonly logger: LoggingService
  ) {}

  /**
   * @function
   * Provides a function to create migration files based on the new changes
   *
   * @param {string} migrationName - The name of the migration file
   */
  async runCreateMigration(migrationName: string) {
    // define the variables for docker container initialization of selected DB engine
    let container!:
      | StartedPostgreSqlContainer
      | StartedMySqlContainer
      | StartedMSSQLServerContainer;
    let containerClient!: Client | Connection | ConnectionPool;

    try {
      const {
        engine,
        proceduresDirectory,
        migrationsDirectory,
        triggersDirectory,
        functionsDirectory,
      } = getConfigManager().getConfig();
      container = await this.injectContainerRepository.initializeContainer();
      containerClient = await this.injectContainerRepository.connectToContainer(container);

      //create a repository that links to the container database after starting the container
      const containerRepository = DBRepositoryFactory.createRepository(engine, containerClient);
      //load the utilities to the container as well
      await containerRepository.preloadUtilities();
      //grab the current timestamp for migration file creation
      const timestamp = Date.now();
      this.logger.info(`Creating migration ${migrationName} at ${timestamp.toString()}`);
      //spread all the three query type directory contents
      const directoryFiles = (
        await getFilesWithDirectories([
          `${proceduresDirectory}`,
          `${functionsDirectory}`,
          `${triggersDirectory}`,
        ])
      ).flat();

      // variable to check if the migration diff has something new or not
      let migrationsFound = false;

      //iterate the directory contents concurrently in a pool
      await PromisePool.withConcurrency(5)
        .for(directoryFiles)
        .handleError((error) => {
          //any errors would be thrown to the user, TODO: add verbose flag
          throw error;
        })
        .process(async (file) => {
          //define two variables to contain the existing SQL found in the DB vs the new changes in the files
          let existingSql = '';
          let newSql = '';

          //check if the directory is for procedures
          if (file.directory === proceduresDirectory) {
            //read file and grab procedure name from the file name
            const procedureFileContents = (
              await readFile(`${proceduresDirectory}/${file.fileName}`)
            ).toString();
            const procedureName = file.fileName.replace('.sql', '');
            this.logger.info(`Found procedure ${procedureName}, checking for changes...`);
            //run the new procedure queries in the file on the container for validation and parsing
            await containerRepository.runInputQueries(procedureFileContents);

            //grab the procedure that was in the source DB and the one newly created in the container
            const [procedureFromClient, procedureFromContainer] = await Promise.all([
              this.injectRepository.getProcedureCodeFromName(procedureName),
              containerRepository.getProcedureCodeFromName(procedureName),
            ]);

            /*extract the procedure source query from the returned result of the source DB
            and set it to the existingSql variable*/
            const mappedProcedureObject = this.injectDAL.mapQueryStatementObjects(
              procedureFromClient,
              'prosrc'
            ).prosrc;
            existingSql =
              this.injectRepository.generateDropStatement(
                procedureName,
                'procedure',
                '',
                /*Postgres does not need drop statements but is required on first time
                creation of a database object*/
                mappedProcedureObject ? false : true
              ) +
              '\n' +
              mappedProcedureObject;

            /*extract the procedure source query from the returned result of the container DB
            and set it to the newSql variable*/
            newSql =
              this.injectRepository.generateDropStatement(procedureName, 'procedure') +
              '\n' +
              this.injectDAL.mapQueryStatementObjects(procedureFromContainer, 'prosrc').prosrc;
          }

          //else check if the directory is for functions
          else if (file.directory === functionsDirectory) {
            //read file and grab function name from the file name
            const functionFileContents = (
              await readFile(`${functionsDirectory}/${file.fileName}`)
            ).toString();

            const functionName = file.fileName.replace('.sql', '');
            this.logger.info(`Found function ${functionName}, checking for changes...`);
            //run the new function queries in the file on the container for validation and parsing
            await containerRepository.runInputQueries(functionFileContents);

            //grab the function that was in the source DB and the one newly created in the container
            const [functionFromClient, functionFromContainer] = await Promise.all([
              this.injectRepository.getFunctionCodeFromName(functionName),
              containerRepository.getFunctionCodeFromName(functionName),
            ]);
            const mappedFunctionObject = this.injectDAL.mapQueryStatementObjects(
              functionFromClient,
              'funsrc'
            ).funsrc;
            /*extract the function source query from the returned result of the source DB
            and set it to the existingSql variable*/
            existingSql =
              this.injectRepository.generateDropStatement(
                functionName,
                'function',
                '',
                mappedFunctionObject ? false : true
              ) +
              '\n' +
              this.injectDAL.mapQueryStatementObjects(functionFromClient, 'funsrc').funsrc;

            /*extract the function source query from the returned result of the container DB
            and set it to the newSql variable*/
            newSql =
              this.injectRepository.generateDropStatement(functionName, 'function') +
              '\n' +
              this.injectDAL.mapQueryStatementObjects(functionFromContainer, 'funsrc').funsrc;
          }

          //else check if the directory is for triggers
          else if (file.directory === triggersDirectory) {
            //read file and grab trigger name from the file name
            const triggerFileContents = (
              await readFile(`${triggersDirectory}/${file.fileName}`)
            ).toString();

            const triggerName = file.fileName.replace('.sql', '');

            /*grab the table name the trigger is set on, This is required as 
            postgres and potentially other engines allow same trigger names
            for different tables*/
            let triggerSourceTable = extractTableName(triggerFileContents);
            this.logger.info(
              `Found trigger ${triggerName} for ${triggerSourceTable}, checking for changes...`
            );
            if (!triggerSourceTable) {
              throw new Error(`Source Table not found for the Trigger ${triggerName}`);
            }
            // extract the trigger source code for the given table from the source DB
            const [triggerFromClient] = await Promise.all([
              this.injectRepository.getTriggerCodeFromName(triggerName, triggerSourceTable),
            ]);

            // set it to existingSql
            existingSql = this.injectDAL.mapQueryStatementObjects(
              triggerFromClient,
              'trigsrc'
            ).trigsrc;
            // const oldTableName = extractTableName(existingSql);

            existingSql =
              this.injectRepository.generateDropStatement(
                triggerName,
                'trigger',
                triggerSourceTable
              ) +
              '\n' +
              existingSql;

            //extract the function name the trigger in source DB is using
            const oldFunctionName = extractFunctionName(existingSql);

            //extract the function name the new changes point to
            const newFunctionName = extractFunctionName(triggerFileContents);
            // if (!newFunctionName) {
            //   throw new Error(
            //     `Function not found for the Trigger ${triggerName}`
            //   );
            // }

            //get DDL of the table being used in the source DB trigger
            const triggerTableDefinition =
              await this.injectRepository.getTableDDL(triggerSourceTable);

            /*run the above DDL in container DB to make sure that the table exists, 
              otherwise the trigger would fail in creation unlike functions and procedures*/
            await containerRepository.runInputQueries(
              this.injectDAL.mapQueryStatementObjects(triggerTableDefinition, 'tabledef').tabledef
            );

            //if the table does not already exist, create it in container DB
            // if (oldTableName !== triggerSourceTable) {
            // await containerRepository.createTempTable(triggerSourceTable);
            // }

            //if the function does not already exist, create it in container DB
            if (newFunctionName && oldFunctionName !== newFunctionName) {
              await containerRepository.createTempFunction(newFunctionName);
            }

            //finally create the trigger on the container DB
            await containerRepository.runInputQueries(triggerFileContents);

            //grab the created trigger from the container DB
            const existingTrigger = await containerRepository.getTriggerCodeFromName(
              triggerName,
              triggerSourceTable
            );

            const triggerFromContainer = this.injectDAL.mapQueryStatementObjects(
              existingTrigger,
              'trigsrc'
            ).trigsrc;

            //set the newSql to the one created in container DB
            newSql =
              this.injectRepository.generateDropStatement(
                triggerName,
                'trigger',
                triggerSourceTable
              ) +
              '\n' +
              triggerFromContainer;
          }

          //check if the sql queries exist in the variables and compare hashes of the strings
          if (
            !compareHashesFromStrings(
              existingSql.trim().replace(/\r/g, ''),
              newSql.trim().replace(/\r/g, '')
            )
          ) {
            //set this to true since we do have some changes
            migrationsFound = true;

            /*create a migration directory if not exists and 
             an UP and a DOWN file in memory*/
            await Promise.all([
              createDirectoryIfNotExists(migrationsDirectory as string),
              createMigrationUpAndDownFilesInMemory(timestamp, migrationName),
            ]);

            /*append the sql variables to the created boilerplate files
            existingSql goes DOWN and the newSql goes UP*/
            await appendToMigrationFilesInMemory(timestamp, migrationName, existingSql, newSql);
          }
        });

      //if the migrationsFound flag remains false, raise a log
      if (!migrationsFound) {
        this.logger.info('No Migrations Found');
      } else {
        //finally, write all that memory stored files to disk
        await writeCombinedMigrationFileToDisk(
          timestamp,
          migrationName,
          migrationsDirectory as string
        );
        this.logger.success(`${migrationName} has been generated successfully`);
      }
    } catch (error) {
      this.logger.error('Error while generating migration: ', error);
    } finally {
      //cleanup: disconnect from the DBs and stop the container
      await this.injectContainerRepository.disconnectFromContainer(containerClient);
      await this.injectContainerRepository.stopContainer(container);
      await this.injectRepository.closeConnection();
    }
  }
}
