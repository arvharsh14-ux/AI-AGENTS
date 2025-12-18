import axios from 'axios';
import { BaseConnector, ConnectorAction, ConnectorConfig } from './base-connector';
import { interpolateVariables } from '@/lib/workflow/interpolation';
import type { ExecutionContext, StepResult } from '@/lib/types/workflow.types';

export class SlackConnector extends BaseConnector {
  readonly type = 'slack';
  readonly name = 'Slack';
  readonly description = 'Send messages to Slack channels and users';
  
  readonly actions: ConnectorAction[] = [
    {
      name: 'send_message',
      description: 'Send a message to a Slack channel or user',
      inputSchema: {
        channel: { type: 'string', required: true, description: 'Channel ID or name' },
        text: { type: 'string', required: true, description: 'Message text' },
        blocks: { type: 'array', required: false, description: 'Slack blocks for rich formatting' },
        thread_ts: { type: 'string', required: false, description: 'Thread timestamp for replies' },
      },
      outputSchema: {
        ok: { type: 'boolean' },
        channel: { type: 'string' },
        ts: { type: 'string' },
        message: { type: 'object' },
      },
    },
    {
      name: 'update_message',
      description: 'Update an existing Slack message',
      inputSchema: {
        channel: { type: 'string', required: true },
        ts: { type: 'string', required: true, description: 'Message timestamp' },
        text: { type: 'string', required: true },
        blocks: { type: 'array', required: false },
      },
      outputSchema: {
        ok: { type: 'boolean' },
        channel: { type: 'string' },
        ts: { type: 'string' },
      },
    },
    {
      name: 'add_reaction',
      description: 'Add an emoji reaction to a message',
      inputSchema: {
        channel: { type: 'string', required: true },
        timestamp: { type: 'string', required: true },
        name: { type: 'string', required: true, description: 'Emoji name without colons' },
      },
      outputSchema: {
        ok: { type: 'boolean' },
      },
    },
  ];

  async execute(
    action: string,
    config: ConnectorConfig,
    context: ExecutionContext
  ): Promise<StepResult> {
    try {
      if (!config.credentialId) {
        return this.createErrorResult('Slack credential not configured');
      }

      const credentials = await this.getCredentials(config.credentialId, context.userId || '');
      const token = credentials.bot_token || credentials.access_token;

      if (!token) {
        return this.createErrorResult('Slack bot token not found in credentials');
      }

      const interpolatedConfig = interpolateVariables(config, {
        input: context.input,
        variables: context.variables,
        metadata: context.metadata,
      }) as ConnectorConfig;

      switch (action) {
        case 'send_message':
          return await this.sendMessage(token, interpolatedConfig);
        case 'update_message':
          return await this.updateMessage(token, interpolatedConfig);
        case 'add_reaction':
          return await this.addReaction(token, interpolatedConfig);
        default:
          return this.createErrorResult(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      return this.createErrorResult(error.message || 'Slack connector failed');
    }
  }

  private async sendMessage(token: string, config: ConnectorConfig): Promise<StepResult> {
    const response = await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: config.channel,
        text: config.text,
        blocks: config.blocks,
        thread_ts: config.thread_ts,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data.ok) {
      return this.createErrorResult(`Slack API error: ${response.data.error}`);
    }

    return this.createSuccessResult(response.data);
  }

  private async updateMessage(token: string, config: ConnectorConfig): Promise<StepResult> {
    const response = await axios.post(
      'https://slack.com/api/chat.update',
      {
        channel: config.channel,
        ts: config.ts,
        text: config.text,
        blocks: config.blocks,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data.ok) {
      return this.createErrorResult(`Slack API error: ${response.data.error}`);
    }

    return this.createSuccessResult(response.data);
  }

  private async addReaction(token: string, config: ConnectorConfig): Promise<StepResult> {
    const response = await axios.post(
      'https://slack.com/api/reactions.add',
      {
        channel: config.channel,
        timestamp: config.timestamp,
        name: config.name,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data.ok) {
      return this.createErrorResult(`Slack API error: ${response.data.error}`);
    }

    return this.createSuccessResult(response.data);
  }
}

export const slackConnector = new SlackConnector();
