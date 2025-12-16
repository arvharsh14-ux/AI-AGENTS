import { BaseStepRunner } from './base';
import type { ExecutionContext, DelayConfig, StepResult } from '@/lib/types/workflow.types';

export class DelayRunner extends BaseStepRunner {
  async run(config: DelayConfig, context: ExecutionContext): Promise<StepResult> {
    try {
      const delayMs = config.milliseconds || 0;

      if (delayMs < 0) {
        return this.createErrorResult('Delay duration must be non-negative');
      }

      if (delayMs > 300000) {
        return this.createErrorResult('Delay duration must not exceed 5 minutes (300000ms)');
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));

      return this.createSuccessResult(
        {
          delayed: delayMs,
        },
        {
          delayMs,
        }
      );
    } catch (error: any) {
      return this.createErrorResult(
        `Delay execution failed: ${error.message}`
      );
    }
  }
}
