import { Request, Transaction } from 'mssql';
import { getConfigManager } from '../../config/config.context';
import { extractContentBetweenLines } from '../../utils/file.utils';
import { IDAL } from '../DAL/IDAL';
import { IDBRepository } from '../repositories/IDBRepository';
import { LoggingService } from './logging.service';
/**
 * Service responsible for running down of the most recent migration
 * This service provides methods to revert the latest migration.
 */
export class MigrationDownService {
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
   * A function to revert the last run migration
   */
  async runMigrationDown() {
    try {
      const { migrationsDirectory } = getConfigManager().getConfig();

      //escape the table name as it is an identifier
      let { migrationsTable } = getConfigManager().getConfig();
      migrationsTable = this.injectRepository.escapeIdentifier(migrationsTable!);
      //start a transaction

      //get the most recently run migration from the migrations table via the DAL
      const lastRunMigration = this.injectDAL.returnResult(
        await this.injectRepository.getLastRunMigration(migrationsTable as string)
      )?.[0]?.migration_name;
      if (!lastRunMigration) {
        this.logger.info('No previously run migrations found');
        return;
      }
      this.logger.warn(`Found ${lastRunMigration} to be the latest migration, reverting...`);

      const transactionObject = (await this.injectRepository.startTransaction()) as any;

      this.transaction = transactionObject.transaction;
      this.request = transactionObject.request;
      //extract all the queries after the DOWN marker
      const downMigrationsSql = await extractContentBetweenLines(
        migrationsDirectory as string,
        lastRunMigration,
        '-- DOWN'
      );

      //run the queries returned above
      await this.injectRepository.runInputQueries(downMigrationsSql as string, this.request);

      //delete the migration from the migration table
      await this.injectRepository.deleteFromMigrationTable(
        migrationsTable as string,
        lastRunMigration,
        this.request
      );

      //commit
      await this.injectRepository.commitTransaction(this.transaction);
      this.logger.success(`${lastRunMigration} has been reverted successfully`);
    } catch (error) {
      //rollback if any error occurs
      this.logger.error(`Error while reverting migration`, error);
      await this.injectRepository.rollbackTransaction(this.transaction);
    } finally {
      //cleanup
      await this.injectRepository.closeConnection();
    }
  }
}
