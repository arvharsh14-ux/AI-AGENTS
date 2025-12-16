import { Job } from 'bull';
import { dispatchQueue, executionQueue, DispatchJobData, ExecutionJobData } from './queue';
import { workflowService } from '@/lib/services/workflow.service';
import { executionService } from '@/lib/services/execution.service';
import { workflowExecutor } from './executor';

export function startDispatchWorker() {
  dispatchQueue.process(async (job: Job<DispatchJobData>) => {
    const { workflowId, triggerId, input, metadata } = job.data;

    console.log(`[Dispatcher] Processing workflow ${workflowId}`);

    try {
      const activeVersion = await workflowService.getActiveVersion(workflowId);

      if (!activeVersion) {
        throw new Error(`No active version found for workflow ${workflowId}`);
      }

      const execution = await executionService.createExecution({
        workflowVersionId: activeVersion.id,
        triggerId,
        input: input || {},
      });

      console.log(`[Dispatcher] Created execution ${execution.id}`);

      await executionQueue.add({
        executionId: execution.id,
        workflowVersionId: activeVersion.id,
        input: input || {},
      });

      return { executionId: execution.id };
    } catch (error: any) {
      console.error(`[Dispatcher] Failed to dispatch workflow ${workflowId}:`, error);
      throw error;
    }
  });

  dispatchQueue.on('completed', (job, result) => {
    console.log(`[Dispatcher] Job ${job.id} completed:`, result);
  });

  dispatchQueue.on('failed', (job, error) => {
    console.error(`[Dispatcher] Job ${job?.id} failed:`, error);
  });

  console.log('[Dispatcher] Worker started');
}

export function startExecutionWorker(concurrency = 5) {
  executionQueue.process(concurrency, async (job: Job<ExecutionJobData>) => {
    const { executionId } = job.data;

    console.log(`[Executor] Processing execution ${executionId}`);

    try {
      await workflowExecutor.execute(executionId);
      
      console.log(`[Executor] Execution ${executionId} completed successfully`);
      
      return { executionId, status: 'completed' };
    } catch (error: any) {
      console.error(`[Executor] Execution ${executionId} failed:`, error);
      throw error;
    }
  });

  executionQueue.on('completed', (job, result) => {
    console.log(`[Executor] Job ${job.id} completed:`, result);
  });

  executionQueue.on('failed', (job, error) => {
    console.error(`[Executor] Job ${job?.id} failed:`, error);
  });

  console.log(`[Executor] Worker started with concurrency ${concurrency}`);
}

export function startWorkers() {
  startDispatchWorker();
  startExecutionWorker();
  console.log('[Workers] All workers started');
}
