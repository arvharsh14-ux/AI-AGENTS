import { BaseStepRunner } from './base';
import { interpolateVariables } from '../interpolation';
import type { ExecutionContext, LoopConfig, StepResult } from '@/lib/types/workflow.types';

export class LoopRunner extends BaseStepRunner {
  async run(config: LoopConfig, context: ExecutionContext): Promise<StepResult> {
    try {
      const items = interpolateVariables(config.items, {
        input: context.input,
        variables: context.variables,
        metadata: context.metadata,
      });

      if (!Array.isArray(items)) {
        return this.createErrorResult('Loop items must be an array');
      }

      const maxIterations = config.maxIterations || items.length;
      const itemsToProcess = items.slice(0, maxIterations);

      return this.createSuccessResult(
        {
          items: itemsToProcess,
          count: itemsToProcess.length,
          stepId: config.stepId,
          parallel: config.parallel || false,
        },
        {
          totalItems: items.length,
          processedItems: itemsToProcess.length,
        }
      );
    } catch (error: any) {
      return this.createErrorResult(
        `Loop configuration failed: ${error.message}`
      );
    }
  }
}
