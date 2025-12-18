import { BaseStepRunner } from './base';
import { getConnector } from '@/lib/connectors';
import type { ExecutionContext, StepResult } from '@/lib/types/workflow.types';

export interface ConnectorStepConfig {
  connectorType: string;
  action: string;
  credentialId?: string;
  [key: string]: any;
}

export class ConnectorRunner extends BaseStepRunner {
  async run(config: ConnectorStepConfig, context: ExecutionContext): Promise<StepResult> {
    try {
      const connector = getConnector(config.connectorType);
      
      if (!connector) {
        return this.createErrorResult(`Connector type '${config.connectorType}' not found`);
      }

      const result = await connector.execute(config.action, config, context);
      return result;
    } catch (error: any) {
      return this.createErrorResult(error.message || 'Connector execution failed');
    }
  }
}
