import axios from 'axios';
import { BaseStepRunner } from './base';
import { interpolateVariables } from '../interpolation';
import type { ExecutionContext, HttpRequestConfig, StepResult } from '@/lib/types/workflow.types';

export class HttpRequestRunner extends BaseStepRunner {
  async run(config: HttpRequestConfig, context: ExecutionContext): Promise<StepResult> {
    try {
      const interpolatedConfig = interpolateVariables(config, {
        input: context.input,
        variables: context.variables,
        metadata: context.metadata,
      }) as HttpRequestConfig;

      const startTime = Date.now();

      const response = await axios({
        method: interpolatedConfig.method,
        url: interpolatedConfig.url,
        headers: interpolatedConfig.headers,
        data: interpolatedConfig.body,
        timeout: interpolatedConfig.timeout || 30000,
        validateStatus: () => true,
      });

      const duration = Date.now() - startTime;

      return this.createSuccessResult(
        {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
        },
        {
          duration,
          url: interpolatedConfig.url,
          method: interpolatedConfig.method,
        }
      );
    } catch (error: any) {
      return this.createErrorResult(
        error.message || 'HTTP request failed',
        {
          code: error.code,
          url: config.url,
        }
      );
    }
  }
}
