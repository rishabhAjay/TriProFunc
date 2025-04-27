import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PostgresRepository } from '../postgres.repository';
import { Client } from 'pg';

export class PostgresContainerRepository {
  constructor(private readonly postgresRepository: PostgresRepository) {}

  public async initializeContainer() {
    const clientVersion = await this.postgresRepository.getEngineVersion();
    const postgresContainer = new PostgreSqlContainer(
      `postgres:${clientVersion.rows[0].server_version}-alpine`
    );
    // .withEnvironment({ POSTGRES_SHARED_BUFFERS: "128MB" })
    // .withEnvironment({ POSTGRES_MAX_CONNECTIONS: "50" })
    // .withEnvironment({ POSTGRES_SYNCHRONOUS_COMMIT: "off" })
    // .withEnvironment({ POSTGRES_FSYNCOFF: "true" }); // For faster boot at the expense of durability;

    return postgresContainer.start();
  }

  public async connectToContainer(container: StartedPostgreSqlContainer) {
    const mockClient = new Client({
      host: container.getHost(),
      port: container.getPort(),
      database: container.getDatabase(),
      user: container.getUsername(),
      password: container.getPassword(),
    });
    await mockClient.connect();
    return mockClient;
  }

  public async disconnectFromContainer(containerClient: Client) {
    return containerClient.end();
  }

  public async stopContainer(container: StartedPostgreSqlContainer): Promise<any> {
    return container.stop();
  }
}
