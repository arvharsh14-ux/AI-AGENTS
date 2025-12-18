import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

function getApiKeyHashSecret(): string {
  const secret = process.env.API_KEY_HASH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('Missing API_KEY_HASH_SECRET (or NEXTAUTH_SECRET)');
  }
  return secret;
}

function hashApiKey(apiKey: string): string {
  const secret = getApiKeyHashSecret();
  return crypto.createHash('sha256').update(`${secret}.${apiKey}`).digest('hex');
}

export class UserService {
  async getUser(userId: string) {
    return await prisma.user.findUnique({ where: { id: userId } });
  }

  async updateProfile(userId: string, data: { name?: string }) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
      },
    });
  }

  async updateWorkspacePreferences(userId: string, preferences: any) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        workspacePreferences: preferences as any,
      },
    });
  }

  async listApiKeys(userId: string) {
    return await prisma.userApiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        last4: true,
        createdAt: true,
        revokedAt: true,
      },
    });
  }

  async createApiKey(userId: string, name: string) {
    const raw = `ak_${crypto.randomBytes(24).toString('base64url')}`;
    const hashedKey = hashApiKey(raw);

    const record = await prisma.userApiKey.create({
      data: {
        userId,
        name,
        hashedKey,
        last4: raw.slice(-4),
      },
      select: {
        id: true,
        name: true,
        last4: true,
        createdAt: true,
        revokedAt: true,
      },
    });

    return { apiKey: record, token: raw };
  }

  async revokeApiKey(userId: string, apiKeyId: string) {
    const existing = await prisma.userApiKey.findFirst({
      where: { id: apiKeyId, userId },
    });

    if (!existing) {
      throw new Error('API key not found');
    }

    return await prisma.userApiKey.update({
      where: { id: existing.id },
      data: {
        revokedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        last4: true,
        createdAt: true,
        revokedAt: true,
      },
    });
  }
}

export const userService = new UserService();
