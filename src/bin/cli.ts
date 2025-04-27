import { Command } from 'commander';
import createMigrationCommand from '../commands/createMigrationCommand';
import { configDotenv } from 'dotenv';
import generateSqlCommand from '../commands/generateSqlCommand';
import migrateUpCommand from '../commands/migrateUpCommand';
import migrationDownCommand from '../commands/migrationDownCommand';
import { DatabaseConnectionFactory } from '../config/connection.factory';
import { DBRepositoryFactory } from '../lib/repositories/db.repository.factory';
import { DALFactory } from '../lib/DAL/dal.factory';
import path from 'path';
import { register } from 'ts-node';
import { pathToFileURL } from 'url';
import { getConfigManager, setConfigManager } from '../config/config.context';
import { InternalConfigManager } from '../config/internal.config.manager';
import { ClientConfigManager } from '../config/client.config.manager';
import { DbEngineMapping } from '../lib';
configDotenv();

/**
 * Imports the given client config either from a TS file or a JS file
 *
 * @param {string} configPath - The path of the user config file
 * @returns {Promise<ClientConfigManager<DbEngineMapping['engine']>>} The calculated area.
 */
async function loadUserConfig(
  configPath: string
): Promise<ClientConfigManager<DbEngineMapping['engine']>> {
  let configManagerInstance;
  const resolvedPath = path.resolve(process.cwd(), configPath);
  const extname = path.extname(resolvedPath);
  const configUrl = pathToFileURL(resolvedPath);
  if (extname === '.ts') {
    register({
      transpileOnly: true,
      compilerOptions: {
        module: 'CommonJS',
      },
    });

    const { configManager } = await require(resolvedPath);
    configManagerInstance = configManager;
  } else {
    const { configManager } = await import(configUrl.href);
    configManagerInstance = configManager;
  }

  if (!configManagerInstance) throw new Error('Expected configManager export not found');

  return configManagerInstance;
}

function cli() {
  const program = new Command();
  program.name('TriProFunc');
  program.requiredOption('--config <path>', 'Path to DB config file (JS)');
  program.hook('preAction', async (thisCommand) => {
    const configPath = thisCommand.opts().config;

    try {
      setConfigManager(await loadUserConfig(configPath));

      const { engine } = getConfigManager().getConfig();
      const client = DatabaseConnectionFactory.createConnection(engine);
      InternalConfigManager.getInstance().setClientDB(client);
      const connection = await client.connect();
      const clientRepository = DBRepositoryFactory.createRepository(engine, connection);
      InternalConfigManager.getInstance().setClientDBRepository(clientRepository);
      const clientDAL = DALFactory.createRepository(engine);
      InternalConfigManager.getInstance().setClientDAL(clientDAL);
    } catch (err: any) {
      console.error('Failed to load DB config:', err);
      process.exit(1);
    }
  });

  createMigrationCommand(program);
  generateSqlCommand(program);
  migrateUpCommand(program);
  migrationDownCommand(program);
  program.parse(process.argv);
}

export default cli;
