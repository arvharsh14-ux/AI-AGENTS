import { prisma } from '@/lib/prisma';
import type { WorkflowDefinition } from '@/lib/types/workflow.types';

export class WorkflowService {
  async createWorkflow(data: {
    name: string;
    description?: string;
    userId: string;
    isPublic?: boolean;
    rateLimitMaxConcurrent?: number;
    rateLimitPerMinute?: number;
    retryMaxAttempts?: number;
    retryBackoffMs?: number;
  }) {
    return await prisma.workflow.create({
      data,
      include: {
        versions: true,
        triggers: true,
      },
    });
  }

  async getWorkflow(id: string) {
    return await prisma.workflow.findUnique({
      where: { id },
      include: {
        versions: {
          include: {
            steps: true,
          },
        },
        triggers: true,
        connectorInstances: true,
      },
    });
  }

  async listWorkflows(userId: string) {
    return await prisma.workflow.findMany({
      where: { userId },
      include: {
        versions: {
          where: { isActive: true },
          take: 1,
        },
        triggers: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async updateWorkflow(
    id: string,
    data: {
      name?: string;
      description?: string;
      isPublic?: boolean;
      rateLimitMaxConcurrent?: number;
      rateLimitPerMinute?: number;
      retryMaxAttempts?: number;
      retryBackoffMs?: number;
    }
  ) {
    return await prisma.workflow.update({
      where: { id },
      data,
    });
  }

  async deleteWorkflow(id: string) {
    return await prisma.workflow.delete({
      where: { id },
    });
  }

  async createVersion(
    workflowId: string,
    definition: WorkflowDefinition
  ) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { versions: true },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const version = workflow.versions.length + 1;

    return await prisma.workflowVersion.create({
      data: {
        workflowId,
        version,
        definition: definition as any,
      },
      include: {
        steps: true,
      },
    });
  }

  async publishVersion(workflowVersionId: string) {
    const version = await prisma.workflowVersion.findUnique({
      where: { id: workflowVersionId },
    });

    if (!version) {
      throw new Error('Version not found');
    }

    await prisma.$transaction([
      prisma.workflowVersion.updateMany({
        where: {
          workflowId: version.workflowId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      }),
      prisma.workflowVersion.update({
        where: { id: workflowVersionId },
        data: {
          isActive: true,
          publishedAt: new Date(),
        },
      }),
    ]);

    const definition = version.definition as unknown as WorkflowDefinition;
    
    await prisma.step.deleteMany({
      where: { workflowVersionId },
    });

    if (definition.steps && definition.steps.length > 0) {
      await prisma.step.createMany({
        data: definition.steps.map((step) => ({
          workflowVersionId,
          name: step.name,
          type: step.type,
          config: step.config,
          position: step.position,
        })),
      });
    }

    return await prisma.workflowVersion.findUnique({
      where: { id: workflowVersionId },
      include: {
        steps: true,
      },
    });
  }

  async getActiveVersion(workflowId: string) {
    return await prisma.workflowVersion.findFirst({
      where: {
        workflowId,
        isActive: true,
      },
      include: {
        steps: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });
  }

  async getVersion(workflowVersionId: string) {
    return await prisma.workflowVersion.findUnique({
      where: { id: workflowVersionId },
      include: {
        steps: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });
  }
}

export const workflowService = new WorkflowService();
