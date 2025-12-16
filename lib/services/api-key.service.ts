import { prisma } from '@/lib/prisma';
import { generateApiKey, hashApiKey } from '@/lib/encryption';
import type { ApiKey } from '@prisma/client';

export interface CreateApiKeyInput {
  workspaceId: string;
  name: string;
  permissions: Record<string, any>;
  expiresAt?: Date;
  createdBy: string;
}

export interface ApiKeyWithSecret extends ApiKey {
  plainKey?: string;
}

export class ApiKeyService {
  async create(input: CreateApiKeyInput): Promise<ApiKeyWithSecret> {
    const { key, hash, prefix } = generateApiKey('sk');
    
    const apiKey = await prisma.apiKey.create({
      data: {
        workspaceId: input.workspaceId,
        name: input.name,
        keyHash: hash,
        keyPrefix: prefix,
        permissions: input.permissions as any,
        expiresAt: input.expiresAt,
        createdBy: input.createdBy,
      },
    });

    return {
      ...apiKey,
      plainKey: key,
    };
  }

  async findByHash(keyHash: string): Promise<ApiKey | null> {
    return prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        workspace: true,
      },
    });
  }

  async findByWorkspace(workspaceId: string): Promise<ApiKey[]> {
    return prisma.apiKey.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verify(key: string): Promise<ApiKey | null> {
    const hash = hashApiKey(key);
    const apiKey = await this.findByHash(hash);
    
    if (!apiKey) {
      return null;
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return apiKey;
  }

  async delete(id: string): Promise<void> {
    await prisma.apiKey.delete({
      where: { id },
    });
  }

  async logUsage(
    apiKeyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number
  ): Promise<void> {
    await prisma.apiKeyUsage.create({
      data: {
        apiKeyId,
        endpoint,
        method,
        statusCode,
        duration,
      },
    });
  }

  async getUsageStats(apiKeyId: string, days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const usage = await prisma.apiKeyUsage.findMany({
      where: {
        apiKeyId,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'desc' },
    });

    const stats = {
      totalRequests: usage.length,
      successRequests: usage.filter((u) => u.statusCode >= 200 && u.statusCode < 300).length,
      errorRequests: usage.filter((u) => u.statusCode >= 400).length,
      avgDuration: usage.length > 0 
        ? Math.round(usage.reduce((sum, u) => sum + u.duration, 0) / usage.length)
        : 0,
      byEndpoint: usage.reduce((acc, u) => {
        acc[u.endpoint] = (acc[u.endpoint] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return stats;
  }
}

export const apiKeyService = new ApiKeyService();
