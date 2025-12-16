import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowService } from '@/lib/services/workflow.service';
import type { WorkflowDefinition } from '@/lib/types/workflow.types';

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    workflow: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workflowVersion: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    step: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn((operations) => {
      if (Array.isArray(operations)) {
        return Promise.all(operations);
      }
      return operations();
    }),
  },
}));

import { prisma } from '@/lib/prisma';

const mockWorkflow = {
  id: 'workflow-1',
  name: 'Test Workflow',
  description: 'A test workflow',
  userId: 'user-1',
  isPublic: false,
  rateLimitMaxConcurrent: 5,
  rateLimitPerMinute: 100,
  retryMaxAttempts: 3,
  retryBackoffMs: 1000,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockVersion = {
  id: 'version-1',
  workflowId: 'workflow-1',
  version: 1,
  definition: { steps: [] },
  isActive: false,
  publishedAt: null,
  createdAt: new Date(),
};

describe('WorkflowService', () => {
  let service: WorkflowService;

  beforeEach(() => {
    service = new WorkflowService();
    vi.clearAllMocks();
  });

  describe('createWorkflow', () => {
    it('should create a new workflow', async () => {
      const createMock = vi.mocked(prisma.workflow.create);
      createMock.mockResolvedValue({
        ...mockWorkflow,
        versions: [],
        triggers: [],
      } as any);

      const result = await service.createWorkflow({
        name: 'Test Workflow',
        description: 'A test workflow',
        userId: 'user-1',
      });

      expect(createMock).toHaveBeenCalledWith({
        data: {
          name: 'Test Workflow',
          description: 'A test workflow',
          userId: 'user-1',
        },
        include: {
          versions: true,
          triggers: true,
        },
      });

      expect(result.name).toBe('Test Workflow');
      expect(result.userId).toBe('user-1');
    });

    it('should create workflow with all optional fields', async () => {
      const createMock = vi.mocked(prisma.workflow.create);
      createMock.mockResolvedValue({
        ...mockWorkflow,
        versions: [],
        triggers: [],
      } as any);

      await service.createWorkflow({
        name: 'Test Workflow',
        userId: 'user-1',
        isPublic: true,
        rateLimitMaxConcurrent: 10,
        rateLimitPerMinute: 200,
      });

      expect(createMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isPublic: true,
          rateLimitMaxConcurrent: 10,
          rateLimitPerMinute: 200,
        }),
        include: expect.anything(),
      });
    });
  });

  describe('getWorkflow', () => {
    it('should retrieve a workflow by id', async () => {
      const getMock = vi.mocked(prisma.workflow.findUnique);
      getMock.mockResolvedValue({
        ...mockWorkflow,
        versions: [mockVersion],
        triggers: [],
        connectorInstances: [],
      } as any);

      const result = await service.getWorkflow('workflow-1');

      expect(getMock).toHaveBeenCalledWith({
        where: { id: 'workflow-1' },
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

      expect(result?.id).toBe('workflow-1');
    });

    it('should return null when workflow not found', async () => {
      const getMock = vi.mocked(prisma.workflow.findUnique);
      getMock.mockResolvedValue(null);

      const result = await service.getWorkflow('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('listWorkflows', () => {
    it('should list all workflows for a user', async () => {
      const listMock = vi.mocked(prisma.workflow.findMany);
      listMock.mockResolvedValue([
        {
          ...mockWorkflow,
          versions: [mockVersion],
          triggers: [],
        },
      ] as any);

      const result = await service.listWorkflows('user-1');

      expect(listMock).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
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

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it('should return empty array when user has no workflows', async () => {
      const listMock = vi.mocked(prisma.workflow.findMany);
      listMock.mockResolvedValue([]);

      const result = await service.listWorkflows('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('updateWorkflow', () => {
    it('should update workflow properties', async () => {
      const updateMock = vi.mocked(prisma.workflow.update);
      updateMock.mockResolvedValue({
        ...mockWorkflow,
        name: 'Updated Workflow',
      } as any);

      const result = await service.updateWorkflow('workflow-1', {
        name: 'Updated Workflow',
      });

      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 'workflow-1' },
        data: {
          name: 'Updated Workflow',
        },
      });

      expect(result.name).toBe('Updated Workflow');
    });

    it('should update multiple fields', async () => {
      const updateMock = vi.mocked(prisma.workflow.update);
      updateMock.mockResolvedValue({
        ...mockWorkflow,
        name: 'Updated',
        description: 'New description',
        isPublic: true,
      } as any);

      await service.updateWorkflow('workflow-1', {
        name: 'Updated',
        description: 'New description',
        isPublic: true,
      });

      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 'workflow-1' },
        data: {
          name: 'Updated',
          description: 'New description',
          isPublic: true,
        },
      });
    });
  });

  describe('deleteWorkflow', () => {
    it('should delete a workflow', async () => {
      const deleteMock = vi.mocked(prisma.workflow.delete);
      deleteMock.mockResolvedValue(mockWorkflow as any);

      await service.deleteWorkflow('workflow-1');

      expect(deleteMock).toHaveBeenCalledWith({
        where: { id: 'workflow-1' },
      });
    });
  });

  describe('createVersion', () => {
    it('should create a new workflow version', async () => {
      const findMock = vi.mocked(prisma.workflow.findUnique);
      const createMock = vi.mocked(prisma.workflowVersion.create);

      findMock.mockResolvedValue({
        ...mockWorkflow,
        versions: [],
      } as any);

      createMock.mockResolvedValue({
        ...mockVersion,
        steps: [],
      } as any);

      const definition: WorkflowDefinition = {
        steps: [
          {
            id: 'step-1',
            name: 'Step 1',
            type: 'http_request',
            config: {},
            position: 0,
          },
        ],
      };

      const result = await service.createVersion('workflow-1', definition);

      expect(createMock).toHaveBeenCalledWith({
        data: {
          workflowId: 'workflow-1',
          version: 1,
          definition: expect.anything(),
        },
        include: {
          steps: true,
        },
      });

      expect(result.version).toBe(1);
    });

    it('should increment version number', async () => {
      const findMock = vi.mocked(prisma.workflow.findUnique);
      const createMock = vi.mocked(prisma.workflowVersion.create);

      findMock.mockResolvedValue({
        ...mockWorkflow,
        versions: [
          { ...mockVersion, version: 1 },
          { ...mockVersion, version: 2 },
        ],
      } as any);

      createMock.mockResolvedValue({
        ...mockVersion,
        version: 3,
        steps: [],
      } as any);

      const definition: WorkflowDefinition = { steps: [] };
      await service.createVersion('workflow-1', definition);

      expect(createMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          version: 3,
        }),
        include: expect.anything(),
      });
    });

    it('should throw error if workflow not found', async () => {
      const findMock = vi.mocked(prisma.workflow.findUnique);
      findMock.mockResolvedValue(null);

      const definition: WorkflowDefinition = { steps: [] };

      await expect(
        service.createVersion('nonexistent', definition),
      ).rejects.toThrow('Workflow not found');
    });
  });

  describe('publishVersion', () => {
    it('should publish a version and deactivate others', async () => {
      const findMock = vi.mocked(prisma.workflowVersion.findUnique);
      const updateManyMock = vi.mocked(prisma.workflowVersion.updateMany);
      const updateMock = vi.mocked(prisma.workflowVersion.update);
      const deleteMock = vi.mocked(prisma.step.deleteMany);
      const createManyMock = vi.mocked(prisma.step.createMany);
      const transactionMock = vi.mocked(prisma.$transaction);

      const definition: WorkflowDefinition = {
        steps: [
          {
            id: 'step-1',
            name: 'Step 1',
            type: 'http_request',
            config: {},
            position: 0,
          },
        ],
      };

      // First call to findUnique (at start of publishVersion)
      // Second call to findUnique (at end, returns published version)
      findMock
        .mockResolvedValueOnce({
          ...mockVersion,
          definition,
        } as any)
        .mockResolvedValueOnce({
          ...mockVersion,
          isActive: true,
          publishedAt: new Date(),
          steps: [],
        } as any);

      updateManyMock.mockResolvedValue({ count: 1 });
      
      transactionMock.mockResolvedValue([
        { count: 1 },
        {
          ...mockVersion,
          isActive: true,
          publishedAt: new Date(),
        },
      ] as any);

      deleteMock.mockResolvedValue({ count: 0 });
      createManyMock.mockResolvedValue({ count: 1 });

      const result = await service.publishVersion('version-1');

      expect(result?.isActive).toBe(true);
      expect(deleteMock).toHaveBeenCalled();
    });

    it('should throw error if version not found', async () => {
      const findMock = vi.mocked(prisma.workflowVersion.findUnique);
      findMock.mockResolvedValue(null);

      await expect(
        service.publishVersion('nonexistent'),
      ).rejects.toThrow('Version not found');
    });
  });
});
