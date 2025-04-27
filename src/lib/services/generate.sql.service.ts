import PromisePool from '@supercharge/promise-pool';
import { appendSemicolonToString, createDirectoryIfNotExists } from '../../utils/file.utils';
import { getConfigManager } from '../../config/config.context';
import { writeFile } from 'fs/promises';
import { LoggingService } from './logging.service';
import { extractTableName } from '../../utils/sql.utils';
import { IDAL } from '../DAL/IDAL';
import { IDBRepository } from '../repositories/IDBRepository';
/**
 * Service responsible for generating files for triggers, procedures and functions off of an existing Database.
 * This service provides methods to create directories and corresponding SQL files.
 */
export class GenerateSqlService {
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
   * A function to create SQL files based off of an existing Database
   *
   * @param {string} folderName - The name of the folder to place all the SQL directories/files in
   */
  async runGenerateSql(folderName: string) {
    try {
      const {
        proceduresDirectory,

        triggersDirectory,
        functionsDirectory,
      } = getConfigManager().getConfig();

      //create the folder in the current directory if not exists
      await createDirectoryIfNotExists(folderName);

      //list all procedures, functions and triggers of the database along with their source code
      const [procedureList, functionList, triggerList] = await Promise.all([
        this.injectRepository.listAllProcedures(),
        this.injectRepository.listAllFunctions(),
        this.injectRepository.listAllTriggers(),
      ]);

      //map the result of the queries using DAL
      const sqlList = [
        ...this.injectDAL.returnResult(procedureList),
        ...this.injectDAL.returnResult(functionList),
        ...this.injectDAL.returnResult(triggerList),
      ];

      //promise pool to run 9 concurrent promises at a time
      await PromisePool.withConcurrency(9)
        .for(sqlList)
        .handleError((error) => {
          throw error;
        })
        .process(async (sqlInfo) => {
          //check if the type of the query is a procedure
          if (sqlInfo.type === 'procedure') {
            //grab the source code and clean it if required
            const cleanedSql = this.injectDAL.cleanQueryDefiner(sqlInfo.procsrc);
            this.logger.info(`Creating procedure ${sqlInfo.procname}.sql:`);
            this.logger.sqlLog(cleanedSql);

            //create the procedures directory within the given input directory
            await createDirectoryIfNotExists(`${folderName}/${proceduresDirectory}`);

            //write the file to the directory with a semicolon trailing at the end
            await writeFile(
              `${folderName}/${proceduresDirectory}/${sqlInfo.procname}.sql`,
              `${cleanedSql}${appendSemicolonToString(cleanedSql)}`
            );
          }
          //check if the type of the query is a function
          else if (sqlInfo.type === 'function') {
            //same stuff as earlier
            const cleanedSql = this.injectDAL.cleanQueryDefiner(sqlInfo.funsrc);

            this.logger.info(`Creating function ${sqlInfo.funname}.sql:`);
            this.logger.sqlLog(cleanedSql);

            await createDirectoryIfNotExists(`${folderName}/${functionsDirectory}`);

            await writeFile(
              `${folderName}/${functionsDirectory}/${sqlInfo.funname}.sql`,
              `${cleanedSql}${appendSemicolonToString(cleanedSql)}`
            );
          }
          //else check if the type of sql is a trigger
          else if (sqlInfo.type === 'trigger') {
            //grab the source code and clean it if required
            const cleanedSql = this.injectDAL.cleanQueryDefiner(sqlInfo.trigsrc);

            /*grab the table name of the trigger which it was created on
            this is required since postgres supports same trigger names 
            on different tables*/
            const triggerTableName = extractTableName(cleanedSql);

            this.logger.info(`Creating trigger ${sqlInfo.trigname}_${triggerTableName}.sql:`);
            this.logger.sqlLog(cleanedSql);

            //rest is the usual stuff
            await createDirectoryIfNotExists(`${folderName}/${triggersDirectory}`);

            await writeFile(
              `${folderName}/${triggersDirectory}/${sqlInfo.trigname}_${triggerTableName}.sql`,
              `${cleanedSql}${appendSemicolonToString(cleanedSql)}`
            );
          }
        });
      this.logger.success(`All SQL files have been generated successfully`);
    } catch (error: any) {
      this.logger.error('Error during generating SQL for your Database', error);
    } finally {
      //cleanup
      await this.injectRepository.closeConnection();
    }
  }
}
