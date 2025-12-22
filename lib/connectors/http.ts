import axios from 'axios';
import { BaseConnector, ConnectorAction, ConnectorConfig } from './base-connector';
import { interpolateVariables } from '@/lib/workflow/interpolation';
import type { ExecutionContext, StepResult } from '@/lib/types/workflow.types';
import type { HttpConnectorInstanceConfig, DecryptedHttpConnectorInstanceConfig } from './http.types';
import { encryptString, decryptString, isEncryptedPayload } from '@/lib/security/encryption';
import { hashApiKey } from '@/lib/encryption';

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

// Helper functions for HTTP connector
export function getAuthHeaders(config: DecryptedHttpConnectorInstanceConfig): Record<string, string> {
  const headers: Record<string, string> = {};

  if (config.auth?.type === 'api_key') {
    const headerName = (config.auth as any).headerName || 'X-API-Key';
    headers[headerName] = (config.auth as any).apiKey || '';
  } else if (config.auth?.type === 'bearer_token') {
    headers['Authorization'] = `Bearer ${(config.auth as any).token || ''}`;
  } else if (config.auth?.type === 'basic') {
    const username = (config.auth as any).username || '';
    const password = (config.auth as any).password || '';
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    headers['Authorization'] = `Basic ${encoded}`;
  }

  return headers;
}

export function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export function decryptHttpConnectorConfig(
  config: HttpConnectorInstanceConfig
): DecryptedHttpConnectorInstanceConfig {
  const decryptedAuth = { ...config.auth } as any;

  if (config.auth.type === 'api_key' && 'encryptedApiKey' in config.auth) {
    const encrypted = (config.auth as any).encryptedApiKey;
    decryptedAuth.apiKey = isEncryptedPayload(encrypted) ? decryptString(encrypted) : '';
  } else if (config.auth.type === 'bearer_token' && 'encryptedToken' in config.auth) {
    const encrypted = (config.auth as any).encryptedToken;
    decryptedAuth.token = isEncryptedPayload(encrypted) ? decryptString(encrypted) : '';
  } else if (config.auth.type === 'basic' && 'encryptedPassword' in config.auth) {
    const encrypted = (config.auth as any).encryptedPassword;
    decryptedAuth.password = isEncryptedPayload(encrypted) ? decryptString(encrypted) : '';
  }

  return {
    baseUrl: config.baseUrl,
    auth: decryptedAuth,
  };
}

// Simplified input type for creating connector configs
interface HttpConnectorConfigInput {
  baseUrl: string;
  auth:
    | { type: 'none' }
    | { type: 'api_key'; headerName: string; apiKey: string }
    | { type: 'bearer_token'; token: string }
    | { type: 'basic'; username: string; password: string };
}

export function createHttpConnectorConfig(
  input: HttpConnectorConfigInput
): HttpConnectorInstanceConfig {
  const { baseUrl, auth } = input;

  switch (auth.type) {
    case 'api_key': {
      const encryptedApiKey = encryptString(auth.apiKey);
      return {
        baseUrl,
        auth: {
          type: 'api_key',
          headerName: auth.headerName,
          encryptedApiKey,
          apiKeyLast4: auth.apiKey.slice(-4),
        },
      };
    }

    case 'bearer_token': {
      const encryptedToken = encryptString(auth.token);
      return {
        baseUrl,
        auth: {
          type: 'bearer_token',
          encryptedToken,
          tokenLast4: auth.token.slice(-4),
        },
      };
    }

    case 'basic': {
      const encryptedPassword = encryptString(auth.password);
      return {
        baseUrl,
        auth: {
          type: 'basic',
          username: auth.username,
          encryptedPassword,
          passwordLast4: auth.password.slice(-4),
        },
      };
    }

    case 'none':
    default:
      return {
        baseUrl,
        auth: {
          type: 'none',
        },
      };
  }
}
