import { Command } from 'commander';
import { LoggingService } from '../lib/services/logging.service';
import { GenerateSqlService } from '../lib/services/generate.sql.service';
import { InternalConfigManager } from '../config/internal.config.manager';

const generateSqlCommand = async (program: Command) => {
  program
    .command('generate')
    .description(
      'Takes the procedures, triggers and functions present in the DB and throws it out to the folder you specified'
    )
    .argument('<string>', 'Folder name in which you need to store the generated files')
    .action(async (folderName: string) => {
      const logger = new LoggingService();

      const clientDAL = InternalConfigManager.getInstance().getClientDAL();
      const clientRepository = InternalConfigManager.getInstance().getCLientDBRepository();
      const generateSqlService = new GenerateSqlService(clientDAL, clientRepository, logger);
      return generateSqlService.runGenerateSql(folderName);
    });
};

export default generateSqlCommand;
