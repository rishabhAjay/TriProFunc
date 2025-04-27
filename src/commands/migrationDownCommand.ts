import { Command } from 'commander';
import { LoggingService } from '../lib/services/logging.service';
import { MigrationDownService } from '../lib/services/migration.down.service';
import { InternalConfigManager } from '../config/internal.config.manager';

const migrationDownCommand = async (program: Command) => {
  program
    .command('down')
    .description('Rollback the previously run migration')
    .action(async () => {
      const logger = new LoggingService();
      const clientDAL = InternalConfigManager.getInstance().getClientDAL();
      const clientRepository = InternalConfigManager.getInstance().getCLientDBRepository();
      const migrationDownService = new MigrationDownService(clientDAL, clientRepository, logger);
      return migrationDownService.runMigrationDown();
    });
};

export default migrationDownCommand;
