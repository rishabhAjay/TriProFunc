import { DbEngineMapping } from '../lib';
import { ClientConfigManager } from './client.config.manager';

let configManager: ClientConfigManager<DbEngineMapping['engine']> | null = null;

export function setConfigManager(instance: ClientConfigManager<DbEngineMapping['engine']>) {
  configManager = instance;
}

export function getConfigManager(): ClientConfigManager<DbEngineMapping['engine']> {
  if (!configManager) {
    throw new Error('ConfigManager has not been set yet.');
  }
  return configManager;
}
