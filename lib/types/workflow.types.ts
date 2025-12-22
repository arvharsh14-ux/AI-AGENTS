export type StepType =
  | 'http_request'
  | 'transform'
  | 'conditional'
  | 'loop'
  | 'delay'
  | 'error_handler'
  | 'fallback'
  | 'custom_code';

export type TriggerType = 'manual' | 'webhook' | 'schedule' | 'event' | 'api';

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface WorkflowDefinition {
  steps: StepDefinition[];
  settings?: {
    timeout?: number;
    retryPolicy?: RetryPolicy;
  };
}

export interface StepDefinition {
  id: string;
  name: string;
  type: StepType;
  config: Record<string, any>;
  position: number;
  nextSteps?: string[]; // IDs of next steps (for conditional flows)
  errorHandler?: string; // ID of error handler step
  layout?: { x: number; y: number };
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
  backoffMultiplier?: number;
  maxBackoffMs?: number;
}

export interface RateLimitPolicy {
  maxConcurrent: number;
  perMinute: number;
}

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  versionId: string;
  input: Record<string, any>;
  variables: Record<string, any>;
  metadata: Record<string, any>;
  userId?: string;
  workspaceId?: string;
}

export interface StepResult {
  success: boolean;
  output?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface HttpRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

export interface TransformConfig {
  code: string;
  inputMapping?: Record<string, string>;
  outputMapping?: Record<string, string>;
}

export interface ConditionalConfig {
  condition: string; // JavaScript expression
  trueSteps: string[];
  falseSteps: string[];
}

export interface LoopConfig {
  items: string; // Variable path to array
  stepId: string; // Step to execute for each item
  maxIterations?: number;
  parallel?: boolean;
}

export interface DelayConfig {
  milliseconds: number;
}

export interface CustomCodeConfig {
  language: 'javascript' | 'python';
  code: string;
  timeout?: number;
}

// Database model types
export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  isPublic: boolean;
  rateLimitMaxConcurrent: number | null;
  rateLimitPerMinute: number | null;
  retryMaxAttempts: number;
  retryBackoffMs: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  definition: any; // Json type from Prisma
  isActive: boolean;
  publishedAt: Date | null;
  createdAt: Date;
}
