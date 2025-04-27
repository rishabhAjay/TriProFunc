import { Command } from 'commander';
import { MigrationUpService } from '../lib/services/migration.up.service';
import { LoggingService } from '../lib/services/logging.service';
import { InternalConfigManager } from '../config/internal.config.manager';

const migrateUpCommand = async (program: Command) => {
  program
    .command('up')
    .description('Runs all the pending migrations')
    .action(async () => {
      const logger = new LoggingService();
      const clientDAL = InternalConfigManager.getInstance().getClientDAL();
      const clientRepository = InternalConfigManager.getInstance().getCLientDBRepository();
      const migrationUpService = new MigrationUpService(clientDAL, clientRepository, logger);

      return migrationUpService.runMigrationUp();
    });
};

export default migrateUpCommand;
