import { ConfigOptions, DbEngineMapping } from '../lib';
export class ClientConfigManager<T extends DbEngineMapping['engine']> {
  private config!: ConfigOptions & Extract<DbEngineMapping, { engine: T }>;

  constructor(config: ConfigOptions & Extract<DbEngineMapping, { engine: T }>) {
    this.config = {
      migrationsDirectory: config.migrationsDirectory || 'migrations',
      proceduresDirectory: config.proceduresDirectory || 'procedures',
      triggersDirectory: config.triggersDirectory || 'triggers',
      functionsDirectory: config.functionsDirectory || 'functions',
      migrationsTable: config.migrationsTable || 'other_migrations',
      ...config,
    };
  }

  getConfig(): ConfigOptions & Extract<DbEngineMapping, { engine: T }> {
    return this.config;
  }
}
