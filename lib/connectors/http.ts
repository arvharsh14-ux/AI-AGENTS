import axios from 'axios';
import { BaseConnector, ConnectorAction, ConnectorConfig } from './base-connector';
import { interpolateVariables } from '@/lib/workflow/interpolation';
import type { ExecutionContext, StepResult } from '@/lib/types/workflow.types';

export class HttpConnector extends BaseConnector {
  readonly type = 'http';
  readonly name = 'HTTP';
  readonly description = 'Make HTTP requests with optional authentication';
  
  readonly actions: ConnectorAction[] = [
    {
      name: 'request',
      description: 'Make an HTTP request',
      inputSchema: {
        method: { type: 'string', required: true, description: 'HTTP method (GET, POST, etc.)' },
        url: { type: 'string', required: true, description: 'Request URL' },
        headers: { type: 'object', required: false, description: 'Request headers' },
        body: { type: 'object', required: false, description: 'Request body' },
        params: { type: 'object', required: false, description: 'Query parameters' },
        timeout: { type: 'number', required: false, description: 'Request timeout in ms' },
      },
      outputSchema: {
        status: { type: 'number' },
        headers: { type: 'object' },
        data: { type: 'any' },
      },
    },
  ];

  async execute(
    action: string,
    config: ConnectorConfig,
    context: ExecutionContext
  ): Promise<StepResult> {
    try {
      const interpolatedConfig = interpolateVariables(config, {
        input: context.input,
        variables: context.variables,
        metadata: context.metadata,
      }) as ConnectorConfig;

      let headers = interpolatedConfig.headers || {};

      if (config.credentialId) {
        const credentials = await this.getCredentials(config.credentialId, context.userId || '');
        headers = this.applyAuth(headers, credentials);
      }

      switch (action) {
        case 'request':
          return await this.makeRequest({ ...interpolatedConfig, headers });
        default:
          return this.createErrorResult(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      return this.createErrorResult(error.message || 'HTTP connector failed');
    }
  }

  private applyAuth(headers: Record<string, any>, credentials: Record<string, any>): Record<string, any> {
    const authHeaders = { ...headers };

    if (credentials.type === 'bearer' && credentials.token) {
      authHeaders['Authorization'] = `Bearer ${credentials.token}`;
    } else if (credentials.type === 'basic' && credentials.username && credentials.password) {
      const encoded = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
      authHeaders['Authorization'] = `Basic ${encoded}`;
    } else if (credentials.type === 'api_key') {
      if (credentials.header) {
        authHeaders[credentials.header] = credentials.api_key;
      } else {
        authHeaders['X-API-Key'] = credentials.api_key;
      }
    }

    return authHeaders;
  }

  private async makeRequest(config: ConnectorConfig): Promise<StepResult> {
    const startTime = Date.now();

    const response = await axios({
      method: config.method as any,
      url: config.url,
      headers: config.headers,
      data: config.body,
      params: config.params,
      timeout: config.timeout || 30000,
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
        url: config.url,
        method: config.method,
      }
    );
  }
}

export const httpConnector = new HttpConnector();
