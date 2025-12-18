import { prisma } from '@/lib/prisma';
import { decryptHttpConnectorConfig } from '@/lib/connectors/http';
import type {
  DecryptedHttpConnectorInstanceConfig,
  HttpConnectorInstanceConfig,
} from '@/lib/connectors/http.types';

export class ConnectorInstanceService {
  async listForWorkflow(workflowId: string) {
    return await prisma.connectorInstance.findMany({
      where: { workflowId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getHttpConnectorConfig(
    workflowId: string,
    connectorInstanceId: string
  ): Promise<DecryptedHttpConnectorInstanceConfig> {
    const instance = await prisma.connectorInstance.findFirst({
      where: { id: connectorInstanceId, workflowId },
    });

    if (!instance) {
      throw new Error('Connector not found');
    }

    if (instance.connectorType !== 'http') {
      throw new Error(`Unsupported connector type: ${instance.connectorType}`);
    }

    const config = instance.config as unknown as HttpConnectorInstanceConfig;
    return decryptHttpConnectorConfig(config);
  }
}

export const connectorInstanceService = new ConnectorInstanceService();
