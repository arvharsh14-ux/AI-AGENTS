import { prisma } from '@/lib/prisma';
import type { Connector } from '@prisma/client';

export interface CreateConnectorInput {
  workspaceId: string;
  name: string;
  type: string;
  description?: string;
  config: Record<string, any>;
  credentialId?: string;
}

export interface UpdateConnectorInput {
  name?: string;
  description?: string;
  config?: Record<string, any>;
  credentialId?: string;
  enabled?: boolean;
}

export class ConnectorService {
  async create(input: CreateConnectorInput): Promise<Connector> {
    return prisma.connector.create({
      data: {
        workspaceId: input.workspaceId,
        name: input.name,
        type: input.type,
        description: input.description,
        config: input.config as any,
        credentialId: input.credentialId,
      },
    });
  }

  async findById(id: string): Promise<Connector | null> {
    return prisma.connector.findUnique({
      where: { id },
      include: {
        workspace: true,
        credential: true,
      },
    });
  }

  async findByWorkspace(workspaceId: string): Promise<Connector[]> {
    return prisma.connector.findMany({
      where: { workspaceId },
      include: {
        credential: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByType(workspaceId: string, type: string): Promise<Connector[]> {
    return prisma.connector.findMany({
      where: {
        workspaceId,
        type,
      },
      include: {
        credential: true,
      },
    });
  }

  async update(id: string, input: UpdateConnectorInput): Promise<Connector> {
    return prisma.connector.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.config && { config: input.config as any }),
        ...(input.credentialId !== undefined && { credentialId: input.credentialId }),
        ...(input.enabled !== undefined && { enabled: input.enabled }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.connector.delete({
      where: { id },
    });
  }
}

export const connectorService = new ConnectorService();
