import PromisePool from '@supercharge/promise-pool';
import { getConfigManager } from '../../config/config.context';
import { extractContentBetweenLines } from '../../utils/file.utils';
import { readdir } from 'fs/promises';
import { IDAL } from '../DAL/IDAL';
import { IDBRepository } from '../repositories/IDBRepository';
import { LoggingService } from './logging.service';
import { Request, Transaction } from 'mssql';
/**
 * Service responsible for running UP of the all pending migrations
 * This service provides methods to run the pending migrations.
 */
export class MigrationUpService {
  private request!: Request;
  private transaction!: Transaction;
  /**
   *@constructor
   *
   * @param {IDAL} injectDAL - Inject the data access layer for generalizing object handling and manipulation
   * @param {IDBRepository} injectRepository - Inject the repository based on the selected DB engine
   * @param {LoggingService} logger - Inject the logger service
   */
  constructor(
    private readonly injectDAL: IDAL,
    private readonly injectRepository: IDBRepository,
    private readonly logger: LoggingService
  ) {}

  /**
   *@function
   * A function to run all the pending migrations
   */
  async runMigrationUp() {
    try {
      const { migrationsDirectory } = getConfigManager().getConfig();

      //escape the table name as it is an identifier
      let { migrationsTable } = getConfigManager().getConfig();
      migrationsTable = this.injectRepository.escapeIdentifier(migrationsTable!);
      //read all the migration file names from the migration directory

      console.log('DIR:', process.cwd() + `/${migrationsDirectory}`);
      const files = await readdir((process.cwd() + `/${migrationsDirectory}`) as string); // Read files in the current directory;

      this.logger.info(`Creating ${migrationsTable} table if it does not exist`);
      //create migrations table if it does not exist
      await this.injectRepository.createMigrationsTable(migrationsTable as string, this.request);

      //get all the pending migrations by comparing the files from the migrations directory
      const pendingMigrations = this.injectDAL
        .returnResult(
          await this.injectRepository.getPendingMigrations(files, migrationsTable as string)
        )
        .map((item) => item.pending_migration);

      if (pendingMigrations.length > 0) {
        const transactionObject = (await this.injectRepository.startTransaction()) as any;
        this.transaction = transactionObject.transaction;
        this.request = transactionObject.request;
        await PromisePool.for(pendingMigrations)
          .withConcurrency(5)
          .handleError((error) => {
            throw error;
          })
          .process(async (file) => {
            //start a transaction

            //grab the current timestamp
            const timestamp = Date.now();

            //extract all the queries after the UP marker but before the DOWN
            const upMigrationSql = await extractContentBetweenLines(
              migrationsDirectory as string,
              file,
              '-- UP',
              '-- DOWN'
            );
            this.logger.warn(`Found ${file}, running the following query:`);
            this.logger.sqlLog(upMigrationSql as string);
            //run the queries
            await this.injectRepository.runInputQueries(upMigrationSql as string, this.request);

            //create a record for the migration
            await this.injectRepository.insertIntoMigrationTable(
              migrationsTable as string,
              file,
              timestamp,
              this.request
            );

            //commit
            await this.injectRepository.commitTransaction(this.transaction);
            this.logger.success(`${file} migrated successfully`);
          });
      } else this.logger.info('No pending migrations found');
      //run a promise pool of 5 concurrent promises
    } catch (error) {
      //rollback the transaction on error
      this.logger.error(`Error while running migration`, error);
      console.log(error);
      await this.injectRepository.rollbackTransaction(this.transaction);
    } finally {
      await this.injectRepository.closeConnection();
    }
  }
}
