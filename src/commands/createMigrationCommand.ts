import { getConfigManager } from '../config/config.context';
import { Command } from 'commander';
import { CreateMigrationService } from '../lib/services/create.migration.service';
import { LoggingService } from '../lib/services/logging.service';
import { ContainerRepositoryFactory } from '../lib/repositories/containers/container.repository.factory';
import { InternalConfigManager } from '../config/internal.config.manager';

const createMigrationCommand = async (program: Command) => {
  program
    .command('migrate')
    .description('Create a new migration of procedures, triggers and functions')
    .argument('<string>', 'Name of the migration')
    .action(async (migrationName) => {
      const logger = new LoggingService();

      const { engine } = getConfigManager().getConfig();
      const clientDAL = InternalConfigManager.getInstance().getClientDAL();
      const clientRepository = InternalConfigManager.getInstance().getCLientDBRepository();

      const containerRepository = ContainerRepositoryFactory.createRepository(
        engine,
        clientRepository
      );

      const createMigrationService = new CreateMigrationService(
        clientDAL,
        clientRepository,
        containerRepository,
        logger
      );

      return createMigrationService.runCreateMigration(migrationName);
    });
};

export default createMigrationCommand;
