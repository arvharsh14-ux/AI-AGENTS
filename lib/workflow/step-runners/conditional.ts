import { BaseStepRunner } from './base';
import { evaluateCondition } from '../interpolation';
import type { ExecutionContext, ConditionalConfig, StepResult } from '@/lib/types/workflow.types';

export class ConditionalRunner extends BaseStepRunner {
  async run(config: ConditionalConfig, context: ExecutionContext): Promise<StepResult> {
    try {
      const conditionResult = evaluateCondition(config.condition, {
        input: context.input,
        variables: context.variables,
        metadata: context.metadata,
      });

      return this.createSuccessResult(
        {
          condition: conditionResult,
          nextSteps: conditionResult ? config.trueSteps : config.falseSteps,
        },
        {
          evaluatedCondition: config.condition,
          result: conditionResult,
        }
      );
    } catch (error: any) {
      return this.createErrorResult(
        `Conditional evaluation failed: ${error.message}`
      );
    }
  }
}
