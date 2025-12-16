import Queue from 'bull';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const dispatchQueue = new Queue('workflow-dispatch', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

export const executionQueue = new Queue('workflow-execution', REDIS_URL, {
  defaultJobOptions: {
    attempts: 1, // Retry handled at workflow level
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

export interface DispatchJobData {
  workflowId: string;
  triggerId?: string;
  input?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ExecutionJobData {
  executionId: string;
  workflowVersionId: string;
  input?: Record<string, any>;
}

export async function addDispatchJob(data: DispatchJobData, priority = 0) {
  return await dispatchQueue.add(data, { priority });
}

export async function addExecutionJob(data: ExecutionJobData, priority = 0) {
  return await executionQueue.add(data, { priority });
}

export async function closeQueues() {
  await dispatchQueue.close();
  await executionQueue.close();
}
