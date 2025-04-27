import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';
import { MysqlRepository } from '../mysql.repository';
import { Connection, createConnection } from 'mysql2/promise';

export class MysqlContainerRepository {
  constructor(private readonly mysqlRepository: MysqlRepository) {}

  public async initializeContainer() {
    const [results] = await this.mysqlRepository.getEngineVersion();
    const mysqlContainer = new MySqlContainer(
      `mysql:${(results as any[])[0].server_version}`
    ).withCommand([
      '--log-bin=mysql-bin', // Enable binary logging
      '--log_bin_trust_function_creators=1',
    ]);

    return mysqlContainer.start();
  }

  public async connectToContainer(container: StartedMySqlContainer) {
    return createConnection({
      host: container.getHost(),
      port: container.getPort(),
      database: container.getDatabase(),
      user: container.getUsername(),
      password: container.getUserPassword(),
      multipleStatements: true,
    });
  }

  public async disconnectFromContainer(containerClient: Connection) {
    return containerClient.end();
  }

  public async stopContainer(container: StartedMySqlContainer) {
    return container.stop();
  }
}
