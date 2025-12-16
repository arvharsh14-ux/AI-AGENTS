import type { ExecutionContext, StepResult } from '@/lib/types/workflow.types';

export abstract class BaseStepRunner {
  abstract run(
    config: Record<string, any>,
    context: ExecutionContext
  ): Promise<StepResult>;

  protected createSuccessResult(output: any, metadata?: Record<string, any>): StepResult {
    return {
      success: true,
      output,
      metadata,
    };
  }

  protected createErrorResult(error: string, metadata?: Record<string, any>): StepResult {
    return {
      success: false,
      error,
      metadata,
    };
  }
}
