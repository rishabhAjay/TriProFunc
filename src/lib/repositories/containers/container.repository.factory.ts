import { DbEngines } from '../../types';
import { MssqlRepository } from '../mssql.repository';
import { MysqlRepository } from '../mysql.repository';
import { PostgresRepository } from '../postgres.repository';
import { IContainerRepository } from './IContainerRepository';
import { MssqlContainerRepository } from './mssql.container.repository';
import { MysqlContainerRepository } from './mysql.container.repository';
import { PostgresContainerRepository } from './postgres.container.repository';

export class ContainerRepositoryFactory {
  static createRepository(
    dbType: DbEngines,
    baseRepository: MysqlRepository | PostgresRepository | MssqlRepository
  ): IContainerRepository {
    switch (dbType) {
      case 'mysql':
        return new MysqlContainerRepository(baseRepository as MysqlRepository);
      case 'postgres':
        return new PostgresContainerRepository(baseRepository as PostgresRepository);
      case 'mssql':
        return new MssqlContainerRepository(baseRepository as MssqlRepository);
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }
}
