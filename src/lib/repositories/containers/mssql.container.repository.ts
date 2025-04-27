import { ConnectionPool } from 'mssql';
import { MssqlRepository } from '../mssql.repository';
import { MSSQLServerContainer, StartedMSSQLServerContainer } from '@testcontainers/mssqlserver';

export class MssqlContainerRepository {
  constructor(private readonly mssqlRepository: MssqlRepository) {}

  public async initializeContainer() {
    const { recordset } = await this.mssqlRepository.getEngineVersion();
    const mssqlContainer = new MSSQLServerContainer(
      `mcr.microsoft.com/mssql/server:${recordset[0].server_version}-latest`
    );

    return mssqlContainer.start();
  }

  public async connectToContainer(container: StartedMSSQLServerContainer) {
    const containerConnectionPool = new ConnectionPool({
      server: container.getHost(),
      port: container.getPort(),
      database: container.getDatabase(),
      user: container.getUsername(),
      password: container.getPassword(),
      options: {
        trustServerCertificate: true, // Trust the server certificate (useful for self-signed certificates)
      },
    });
    await containerConnectionPool.connect();
    return containerConnectionPool;
  }

  public async disconnectFromContainer(containerClient: ConnectionPool) {
    return containerClient.close();
  }

  public async stopContainer(container: StartedMSSQLServerContainer) {
    return container.stop();
  }
}
