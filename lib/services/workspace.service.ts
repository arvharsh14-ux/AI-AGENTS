import { prisma } from '@/lib/prisma';
import type { Workspace, WorkspaceMember } from '@prisma/client';

export interface CreateWorkspaceInput {
  name: string;
  slug: string;
  ownerId: string;
  settings?: Record<string, any>;
}

export class WorkspaceService {
  async create(input: CreateWorkspaceInput): Promise<Workspace> {
    const workspace = await prisma.workspace.create({
      data: {
        name: input.name,
        slug: input.slug,
        ownerId: input.ownerId,
        settings: input.settings as any,
      },
    });

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: input.ownerId,
        role: 'owner',
      },
    });

    return workspace;
  }

  async findById(id: string): Promise<Workspace | null> {
    return prisma.workspace.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string): Promise<Workspace | null> {
    return prisma.workspace.findUnique({
      where: { slug },
    });
  }

  async findByUser(userId: string): Promise<Workspace[]> {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
    });

    return memberships.map((m) => m.workspace);
  }

  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return prisma.workspaceMember.findMany({
      where: { workspaceId },
    });
  }

  async addMember(workspaceId: string, userId: string, role: string = 'member'): Promise<WorkspaceMember> {
    return prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role,
      },
    });
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await prisma.workspaceMember.deleteMany({
      where: {
        workspaceId,
        userId,
      },
    });
  }

  async updateMemberRole(workspaceId: string, userId: string, role: string): Promise<WorkspaceMember> {
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
      },
    });

    if (!member) {
      throw new Error('Member not found');
    }

    return prisma.workspaceMember.update({
      where: { id: member.id },
      data: { role },
    });
  }
}

export const workspaceService = new WorkspaceService();
