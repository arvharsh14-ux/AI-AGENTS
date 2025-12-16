import vm from 'vm';
import { BaseStepRunner } from './base';
import { interpolateVariables } from '../interpolation';
import type { ExecutionContext, TransformConfig, StepResult } from '@/lib/types/workflow.types';

export class TransformRunner extends BaseStepRunner {
  async run(config: TransformConfig, context: ExecutionContext): Promise<StepResult> {
    try {
      const inputData = config.inputMapping
        ? interpolateVariables(config.inputMapping, {
            input: context.input,
            variables: context.variables,
            metadata: context.metadata,
          })
        : context.variables;

      const sandbox = {
        input: inputData,
        context: {
          executionId: context.executionId,
          workflowId: context.workflowId,
          metadata: context.metadata,
        },
        console: {
          log: (...args: any[]) => console.log('[Transform]', ...args),
        },
        result: undefined,
      };

      const script = new vm.Script(`
        result = (function() {
          ${config.code}
        })();
      `);

      const vmContext = vm.createContext(sandbox);
      script.runInContext(vmContext, {
        timeout: 5000,
        displayErrors: true,
      });

      let output = sandbox.result;

      if (config.outputMapping) {
        output = interpolateVariables(config.outputMapping, {
          result: output,
          input: inputData,
        });
      }

      return this.createSuccessResult(output);
    } catch (error: any) {
      return this.createErrorResult(
        `Transform execution failed: ${error.message}`
      );
    }
  }
}
