import axios from 'axios';
import { BaseStepRunner } from './base';
import { interpolateVariables } from '../interpolation';
import type {
  ExecutionContext,
  HttpRequestConfig,
  StepResult,
} from '@/lib/types/workflow.types';
import { connectorInstanceService } from '@/lib/services/connector-instance.service';
import { getAuthHeaders, joinUrl } from '@/lib/connectors/http';

type ExtendedHttpRequestConfig = HttpRequestConfig & {
  connectorInstanceId?: string;
  path?: string;
  responsePath?: string;
  responseMapping?: any;
};

export class HttpRequestRunner extends BaseStepRunner {
  async run(
    config: ExtendedHttpRequestConfig,
    context: ExecutionContext
  ): Promise<StepResult> {
    try {
      const interpolatedConfig = interpolateVariables(config, {
        input: context.input,
        variables: context.variables,
        metadata: context.metadata,
      }) as ExtendedHttpRequestConfig;

      const startTime = Date.now();

      let url = interpolatedConfig.url;
      let authHeaders: Record<string, string> = {};

      if (interpolatedConfig.connectorInstanceId) {
        const connector = await connectorInstanceService.getHttpConnectorConfig(
          context.workflowId,
          interpolatedConfig.connectorInstanceId
        );

        authHeaders = getAuthHeaders(connector);

        if (interpolatedConfig.path) {
          url = joinUrl(connector.baseUrl, interpolatedConfig.path);
        } else if (url && !/^https?:\/\//i.test(url)) {
          url = joinUrl(connector.baseUrl, url);
        }
      }

      const response = await axios({
        method: interpolatedConfig.method,
        url,
        headers: {
          ...authHeaders,
          ...(interpolatedConfig.headers || {}),
        },
        data: interpolatedConfig.body,
        timeout: interpolatedConfig.timeout || 30000,
        validateStatus: () => true,
      });

      const duration = Date.now() - startTime;

      const rawOutput = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
      };

      let mapped: any | undefined;

      if (interpolatedConfig.responsePath) {
        mapped = getValueByPath(rawOutput, interpolatedConfig.responsePath);
      }

      if (interpolatedConfig.responseMapping) {
        mapped = interpolateVariables(interpolatedConfig.responseMapping, {
          response: rawOutput,
          input: context.input,
          variables: context.variables,
          metadata: context.metadata,
        });
      }

      return this.createSuccessResult(
        mapped !== undefined ? { ...rawOutput, mapped } : rawOutput,
        {
          duration,
          url,
          method: interpolatedConfig.method,
        }
      );
    } catch (error: any) {
      return this.createErrorResult(error.message || 'HTTP request failed', {
        code: error.code,
        url: config.url,
      });
    }
  }
}

function getValueByPath(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current = current[key];
      if (Array.isArray(current)) {
        current = current[parseInt(index, 10)];
      } else {
        return undefined;
      }
    } else {
      current = current[part];
    }
  }

  return current;
}
