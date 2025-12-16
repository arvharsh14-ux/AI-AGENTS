import { executionService } from '@/lib/services/execution.service';
import { workflowService } from '@/lib/services/workflow.service';
import { HttpRequestRunner } from './step-runners/http-request';
import { TransformRunner } from './step-runners/transform';
import { ConditionalRunner } from './step-runners/conditional';
import { LoopRunner } from './step-runners/loop';
import { DelayRunner } from './step-runners/delay';
import { CustomCodeRunner } from './step-runners/custom-code';
import type { BaseStepRunner } from './step-runners/base';
import type { ExecutionContext, StepType, StepResult } from '@/lib/types/workflow.types';
import { emitExecutionEvent } from './socket';

const stepRunners: Record<StepType, BaseStepRunner> = {
  http_request: new HttpRequestRunner(),
  transform: new TransformRunner(),
  conditional: new ConditionalRunner(),
  loop: new LoopRunner(),
  delay: new DelayRunner(),
  error_handler: new TransformRunner(),
  fallback: new TransformRunner(),
  custom_code: new CustomCodeRunner(),
};

export class WorkflowExecutor {
  async execute(executionId: string): Promise<void> {
    const execution = await executionService.getExecution(executionId);
    
    if (!execution) {
      throw new Error('Execution not found');
    }

    const startTime = Date.now();

    try {
      await executionService.updateExecution(executionId, {
        status: 'running',
      });

      await executionService.addLog(executionId, 'info', 'Workflow execution started');
      emitExecutionEvent(executionId, 'started', { executionId });

      const context: ExecutionContext = {
        executionId,
        workflowId: execution.workflowVersion.workflowId,
        versionId: execution.workflowVersionId,
        input: (execution.input || {}) as Record<string, any>,
        variables: {},
        metadata: {},
      };

      const steps = execution.workflowVersion.steps;
      
      if (!steps || steps.length === 0) {
        throw new Error('No steps defined in workflow');
      }

      for (const step of steps) {
        const stepStartTime = Date.now();
        
        await executionService.addLog(
          executionId,
          'info',
          `Executing step: ${step.name} (${step.type})`
        );

        const executionStep = await executionService.createExecutionStep({
          executionId,
          stepId: step.id,
          input: context.variables,
        });

        try {
          await executionService.updateExecutionStep(executionStep.id, {
            status: 'running',
          });

          emitExecutionEvent(executionId, 'step_started', {
            executionId,
            stepId: step.id,
            stepName: step.name,
          });

          const runner = stepRunners[step.type as StepType];
          
          if (!runner) {
            throw new Error(`Unknown step type: ${step.type}`);
          }

          const result = await this.executeStepWithRetry(
            runner,
            step.config as Record<string, any>,
            context,
            execution.workflowVersion.workflow
          );

          const stepDuration = Date.now() - stepStartTime;

          if (result.success) {
            context.variables[step.name] = result.output;

            await executionService.updateExecutionStep(executionStep.id, {
              status: 'completed',
              output: result.output,
              completedAt: new Date(),
              durationMs: stepDuration,
            });

            await executionService.addLog(
              executionId,
              'info',
              `Step completed: ${step.name}`,
              result.metadata
            );

            emitExecutionEvent(executionId, 'step_completed', {
              executionId,
              stepId: step.id,
              stepName: step.name,
              output: result.output,
            });
          } else {
            await executionService.updateExecutionStep(executionStep.id, {
              status: 'failed',
              error: result.error,
              completedAt: new Date(),
              durationMs: stepDuration,
            });

            await executionService.addLog(
              executionId,
              'error',
              `Step failed: ${step.name} - ${result.error}`,
              result.metadata
            );

            emitExecutionEvent(executionId, 'step_failed', {
              executionId,
              stepId: step.id,
              stepName: step.name,
              error: result.error,
            });

            throw new Error(`Step ${step.name} failed: ${result.error}`);
          }
        } catch (error: any) {
          const stepDuration = Date.now() - stepStartTime;
          
          await executionService.updateExecutionStep(executionStep.id, {
            status: 'failed',
            error: error.message,
            completedAt: new Date(),
            durationMs: stepDuration,
          });

          throw error;
        }
      }

      const duration = Date.now() - startTime;

      await executionService.updateExecution(executionId, {
        status: 'completed',
        output: context.variables,
        completedAt: new Date(),
        durationMs: duration,
      });

      await executionService.addLog(
        executionId,
        'info',
        `Workflow execution completed in ${duration}ms`
      );

      emitExecutionEvent(executionId, 'completed', {
        executionId,
        output: context.variables,
        duration,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;

      await executionService.updateExecution(executionId, {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
        durationMs: duration,
      });

      await executionService.addLog(
        executionId,
        'error',
        `Workflow execution failed: ${error.message}`
      );

      emitExecutionEvent(executionId, 'failed', {
        executionId,
        error: error.message,
        duration,
      });

      throw error;
    }
  }

  private async executeStepWithRetry(
    runner: BaseStepRunner,
    config: Record<string, any>,
    context: ExecutionContext,
    workflow: any
  ): Promise<StepResult> {
    const maxAttempts = workflow.retryMaxAttempts || 3;
    const backoffMs = workflow.retryBackoffMs || 1000;

    let lastError: any;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        const delay = backoffMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        
        await executionService.addLog(
          context.executionId,
          'warn',
          `Retrying step (attempt ${attempt + 1}/${maxAttempts})`
        );
      }

      try {
        const result = await runner.run(config, context);
        
        if (result.success || attempt === maxAttempts - 1) {
          return result;
        }
        
        lastError = result.error;
      } catch (error: any) {
        lastError = error.message;
        
        if (attempt === maxAttempts - 1) {
          return {
            success: false,
            error: lastError,
          };
        }
      }
    }

    return {
      success: false,
      error: lastError || 'Step execution failed',
    };
  }
}

export const workflowExecutor = new WorkflowExecutor();
