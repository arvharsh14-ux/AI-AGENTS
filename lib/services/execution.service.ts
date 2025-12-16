import { prisma } from '@/lib/prisma';
import type { LogLevel } from '@/lib/types/workflow.types';

export class ExecutionService {
  async createExecution(data: {
    workflowVersionId: string;
    triggerId?: string;
    input?: Record<string, any>;
  }) {
    return await prisma.execution.create({
      data: {
        ...data,
        status: 'pending',
      },
      include: {
        workflowVersion: true,
      },
    });
  }

  async getExecution(id: string) {
    return await prisma.execution.findUnique({
      where: { id },
      include: {
        workflowVersion: {
          include: {
            workflow: true,
            steps: {
              orderBy: {
                position: 'asc',
              },
            },
          },
        },
        steps: {
          include: {
            step: true,
          },
          orderBy: {
            startedAt: 'asc',
          },
        },
        logs: {
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });
  }

  async listExecutions(workflowVersionId: string, limit = 50, offset = 0) {
    return await prisma.execution.findMany({
      where: { workflowVersionId },
      include: {
        trigger: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  async updateExecution(
    id: string,
    data: {
      status?: string;
      output?: Record<string, any>;
      error?: string;
      completedAt?: Date;
      durationMs?: number;
    }
  ) {
    return await prisma.execution.update({
      where: { id },
      data,
    });
  }

  async createExecutionStep(data: {
    executionId: string;
    stepId: string;
    input?: Record<string, any>;
  }) {
    return await prisma.executionStep.create({
      data: {
        ...data,
        status: 'pending',
      },
    });
  }

  async updateExecutionStep(
    id: string,
    data: {
      status?: string;
      output?: Record<string, any>;
      error?: string;
      completedAt?: Date;
      durationMs?: number;
      retryCount?: number;
    }
  ) {
    return await prisma.executionStep.update({
      where: { id },
      data,
    });
  }

  async addLog(
    executionId: string,
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>
  ) {
    return await prisma.executionLog.create({
      data: {
        executionId,
        level,
        message,
        metadata,
      },
    });
  }

  async getLogs(executionId: string) {
    return await prisma.executionLog.findMany({
      where: { executionId },
      orderBy: {
        timestamp: 'asc',
      },
    });
  }

  async incrementRetryCount(executionId: string) {
    const execution = await prisma.execution.findUnique({
      where: { id: executionId },
    });

    if (!execution) {
      throw new Error('Execution not found');
    }

    return await prisma.execution.update({
      where: { id: executionId },
      data: {
        retryCount: execution.retryCount + 1,
      },
    });
  }
}

export const executionService = new ExecutionService();
