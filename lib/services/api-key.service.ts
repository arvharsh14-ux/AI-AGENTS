import { prisma } from '@/lib/prisma';
import { generateApiKey, hashApiKey } from '@/lib/encryption';

export interface CreateApiKeyInput {
  workspaceId: string;
  name: string;
  role: string;
  expiresAt?: Date;
  createdBy: string;
}

export interface ApiKeyWithSecret {
  id: string;
  workspaceId: string;
  name?: string;
  role: string; // Using role instead of permissions to match existing schema
  key: string; // This should be the hashed key from database
  keyPrefix?: string; // Key prefix for display
  expiresAt?: Date | null;
  lastUsedAt?: Date | null;
  usageCount: number;
  createdAt: Date;
  createdBy: string;
  plainKey?: string; // The plain text key (only available on creation)
}

export class ApiKeyService {
  async create(input: CreateApiKeyInput): Promise<ApiKeyWithSecret> {
    const { key, hash, prefix } = generateApiKey();
    
    const apiKey = await prisma.apiKey.create({
      data: {
        workspaceId: input.workspaceId,
        name: input.name,
        key: hash, // Store the hash, not the plain key
        role: input.role,
        expiresAt: input.expiresAt,
      },
    });

    return {
      id: apiKey.id,
      workspaceId: apiKey.workspaceId,
      name: apiKey.name || undefined,
      role: apiKey.role,
      key: apiKey.key, // This is the hash stored in DB
      keyPrefix: prefix,
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      usageCount: apiKey.usageCount,
      createdAt: apiKey.createdAt,
      createdBy: input.createdBy,
      plainKey: key, // Only return plain key to client
    };
  }

  async findByHash(keyHash: string): Promise<ApiKeyWithSecret | null> {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key: keyHash },
      include: {
        workspace: true,
      },
    });

    if (!apiKey) return null;

    return {
      id: apiKey.id,
      workspaceId: apiKey.workspaceId,
      name: apiKey.name || undefined,
      role: apiKey.role,
      key: apiKey.key,
      keyPrefix: (apiKey as any).keyPrefix, // KeyPrefix might not be in DB yet
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      usageCount: apiKey.usageCount,
      createdAt: apiKey.createdAt,
      createdBy: '', // This field isn't in the database schema, we don't have it
    };
  }

  async findByWorkspace(workspaceId: string): Promise<Omit<ApiKeyWithSecret, 'plainKey'>[]> {
    const apiKeys = await prisma.apiKey.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    return apiKeys.map(apiKey => ({
      id: apiKey.id,
      workspaceId: apiKey.workspaceId,
      name: apiKey.name || undefined,
      role: apiKey.role,
      key: apiKey.key,
      keyPrefix: (apiKey as any).keyPrefix, // KeyPrefix might not be in DB yet
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      usageCount: apiKey.usageCount,
      createdAt: apiKey.createdAt,
      createdBy: '', // This field isn't in the database schema
    }));
  }

  async verify(key: string): Promise<ApiKeyWithSecret | null> {
    const hash = hashApiKey(key);
    const apiKey = await prisma.apiKey.findUnique({
      where: { key: hash },
      include: {
        workspace: true,
      },
    });
    
    if (!apiKey) {
      return null;
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { 
        lastUsedAt: new Date(),
        usageCount: { increment: 1 }
      },
    });

    return {
      id: apiKey.id,
      workspaceId: apiKey.workspaceId,
      name: apiKey.name || undefined,
      role: apiKey.role,
      key: apiKey.key,
      keyPrefix: (apiKey as any).keyPrefix, // KeyPrefix might not be in DB yet
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      usageCount: apiKey.usageCount,
      createdAt: apiKey.createdAt,
      createdBy: '', // This field isn't in the database schema
    };
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
