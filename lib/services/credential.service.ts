import { prisma } from '@/lib/prisma';
import { encryptJSON, decryptJSON } from '@/lib/encryption';
import type { Credential, AuditLog } from '@prisma/client';

export interface CreateCredentialInput {
  workspaceId: string;
  name: string;
  description?: string;
  type: 'oauth' | 'api_key' | 'basic_auth' | 'token' | 'custom';
  provider?: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
  rotationPolicy?: Record<string, any>;
  expiresAt?: Date;
  createdBy: string;
}

export interface UpdateCredentialInput {
  name?: string;
  description?: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  rotationPolicy?: Record<string, any>;
  expiresAt?: Date;
}

export class CredentialService {
  async create(input: CreateCredentialInput): Promise<Credential> {
    const encryptedData = encryptJSON(input.data);
    
    const credential = await prisma.credential.create({
      data: {
        workspaceId: input.workspaceId,
        name: input.name,
        description: input.description,
        type: input.type,
        provider: input.provider,
        encryptedData,
        metadata: input.metadata as any,
        rotationPolicy: input.rotationPolicy as any,
        expiresAt: input.expiresAt,
        createdBy: input.createdBy,
      },
    });

    await this.createAuditLog({
      workspaceId: input.workspaceId,
      userId: input.createdBy,
      action: 'create',
      resourceType: 'credential',
      resourceId: credential.id,
      credentialId: credential.id,
      details: {
        name: credential.name,
        type: credential.type,
        provider: credential.provider,
      },
    });

    return credential;
  }

  async findById(id: string): Promise<Credential | null> {
    return prisma.credential.findUnique({
      where: { id },
      include: {
        workspace: true,
      },
    });
  }

  async findByWorkspace(workspaceId: string): Promise<Credential[]> {
    return prisma.credential.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, input: UpdateCredentialInput, userId: string): Promise<Credential> {
    const credential = await this.findById(id);
    if (!credential) {
      throw new Error('Credential not found');
    }

    const updateData: any = {
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.metadata && { metadata: input.metadata }),
      ...(input.rotationPolicy && { rotationPolicy: input.rotationPolicy }),
      ...(input.expiresAt !== undefined && { expiresAt: input.expiresAt }),
    };

    if (input.data) {
      updateData.encryptedData = encryptJSON(input.data);
    }

    const updated = await prisma.credential.update({
      where: { id },
      data: updateData,
    });

    await this.createAuditLog({
      workspaceId: credential.workspaceId,
      userId,
      action: 'update',
      resourceType: 'credential',
      resourceId: id,
      credentialId: id,
      details: { changes: Object.keys(input) },
    });

    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const credential = await this.findById(id);
    if (!credential) {
      throw new Error('Credential not found');
    }

    await this.createAuditLog({
      workspaceId: credential.workspaceId,
      userId,
      action: 'delete',
      resourceType: 'credential',
      resourceId: id,
      credentialId: id,
      details: {
        name: credential.name,
        type: credential.type,
      },
    });

    await prisma.credential.delete({
      where: { id },
    });
  }

  async getDecryptedData(id: string, userId: string): Promise<Record<string, any>> {
    const credential = await this.findById(id);
    if (!credential) {
      throw new Error('Credential not found');
    }

    await this.createAuditLog({
      workspaceId: credential.workspaceId,
      userId,
      action: 'access',
      resourceType: 'credential',
      resourceId: id,
      credentialId: id,
    });

    return decryptJSON(credential.encryptedData);
  }

  async rotate(id: string, newData: Record<string, any>, userId: string): Promise<Credential> {
    const credential = await this.findById(id);
    if (!credential) {
      throw new Error('Credential not found');
    }

    const updated = await prisma.credential.update({
      where: { id },
      data: {
        encryptedData: encryptJSON(newData),
        lastRotatedAt: new Date(),
      },
    });

    await this.createAuditLog({
      workspaceId: credential.workspaceId,
      userId,
      action: 'rotate',
      resourceType: 'credential',
      resourceId: id,
      credentialId: id,
    });

    return updated;
  }

  async getAuditLogs(credentialId: string, limit: number = 100): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: { credentialId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  private async createAuditLog(data: {
    workspaceId: string;
    userId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    credentialId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        workspaceId: data.workspaceId,
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        credentialId: data.credentialId,
        details: data.details as any,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }
}

export const credentialService = new CredentialService();
