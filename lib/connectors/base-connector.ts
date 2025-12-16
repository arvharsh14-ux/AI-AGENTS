import type { ExecutionContext, StepResult } from '@/lib/types/workflow.types';
import { credentialService } from '@/lib/services/credential.service';

export interface ConnectorConfig {
  credentialId?: string;
  [key: string]: any;
}

export interface ConnectorAction {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
}

export abstract class BaseConnector {
  abstract readonly type: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly actions: ConnectorAction[];

  protected async getCredentials(credentialId: string, userId: string): Promise<Record<string, any>> {
    return credentialService.getDecryptedData(credentialId, userId);
  }

  abstract execute(
    action: string,
    config: ConnectorConfig,
    context: ExecutionContext
  ): Promise<StepResult>;

  protected createSuccessResult(output: any, metadata?: Record<string, any>): StepResult {
    return {
      success: true,
      output,
      metadata,
    };
  }

  protected createErrorResult(error: string, metadata?: Record<string, any>): StepResult {
    return {
      success: false,
      error,
      metadata,
    };
  }
}
