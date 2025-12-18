/**
 * AI Agents TypeScript SDK
 * Auto-generated client for the AI Agents Workflow API
 */

export interface WorkflowsClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Credential {
  id: string;
  name: string;
  description?: string;
  type: 'oauth' | 'api_key' | 'basic_auth' | 'token' | 'custom';
  provider?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Webhook {
  id: string;
  name: string;
  description?: string;
  url: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Execution {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

export class WorkflowsClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: WorkflowsClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'http://localhost:3000/api/v1';
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Workflows
  async listWorkflows(): Promise<Workflow[]> {
    return this.request<Workflow[]>('GET', '/workflows');
  }

  async createWorkflow(data: {
    name: string;
    description?: string;
    definition?: any;
    isPublic?: boolean;
  }): Promise<Workflow> {
    return this.request<Workflow>('POST', '/workflows', data);
  }

  async getWorkflow(id: string): Promise<Workflow> {
    return this.request<Workflow>('GET', `/workflows/${id}`);
  }

  async updateWorkflow(id: string, data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  }): Promise<Workflow> {
    return this.request<Workflow>('PATCH', `/workflows/${id}`, data);
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.request('DELETE', `/workflows/${id}`);
  }

  async executeWorkflow(id: string, input?: Record<string, any>): Promise<{
    executionId: string;
    status: string;
    startedAt: string;
  }> {
    return this.request('POST', `/workflows/${id}/execute`, { input });
  }

  // Credentials
  async listCredentials(): Promise<Credential[]> {
    return this.request<Credential[]>('GET', '/credentials');
  }

  async createCredential(data: {
    name: string;
    description?: string;
    type: string;
    provider?: string;
    data: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<Credential> {
    return this.request<Credential>('POST', '/credentials', data);
  }

  async getCredential(id: string): Promise<Credential> {
    return this.request<Credential>('GET', `/credentials/${id}`);
  }

  async deleteCredential(id: string): Promise<void> {
    await this.request('DELETE', `/credentials/${id}`);
  }

  // Webhooks
  async listWebhooks(): Promise<Webhook[]> {
    return this.request<Webhook[]>('GET', '/webhooks');
  }

  async createWebhook(data: {
    name: string;
    url: string;
    events: string[];
    description?: string;
    headers?: Record<string, string>;
    retryPolicy?: {
      maxAttempts?: number;
      backoffMs?: number;
    };
  }): Promise<Webhook> {
    return this.request<Webhook>('POST', '/webhooks', data);
  }

  async getWebhook(id: string): Promise<Webhook> {
    return this.request<Webhook>('GET', `/webhooks/${id}`);
  }

  async deleteWebhook(id: string): Promise<void> {
    await this.request('DELETE', `/webhooks/${id}`);
  }

  async getWebhookDeliveries(id: string, limit?: number): Promise<any[]> {
    const query = limit ? `?limit=${limit}` : '';
    return this.request<any[]>('GET', `/webhooks/${id}/deliveries${query}`);
  }

  // Connectors
  async listConnectors(available?: boolean): Promise<any[]> {
    const query = available ? '?available=true' : '';
    return this.request<any[]>('GET', `/connectors${query}`);
  }

  async createConnector(data: {
    name: string;
    type: string;
    description?: string;
    config?: Record<string, any>;
    credentialId?: string;
  }): Promise<any> {
    return this.request('POST', '/connectors', data);
  }

  // Executions
  async getExecution(id: string): Promise<Execution> {
    return this.request<Execution>('GET', `/executions/${id}`);
  }

  async cancelExecution(id: string): Promise<void> {
    await this.request('POST', `/executions/${id}`, { action: 'cancel' });
  }
}

// Usage example:
/*
import { WorkflowsClient } from './sdk/typescript-client';

const client = new WorkflowsClient({
  apiKey: 'sk_your_api_key',
  baseUrl: 'https://your-domain.com/api/v1',
});

// List workflows
const workflows = await client.listWorkflows();

// Execute a workflow
const execution = await client.executeWorkflow('workflow_id', {
  input: { key: 'value' },
});

// Check execution status
const status = await client.getExecution(execution.executionId);
*/
