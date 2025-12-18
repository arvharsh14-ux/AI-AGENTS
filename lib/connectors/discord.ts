import axios from 'axios';
import { BaseConnector, ConnectorAction, ConnectorConfig } from './base-connector';
import { interpolateVariables } from '@/lib/workflow/interpolation';
import type { ExecutionContext, StepResult } from '@/lib/types/workflow.types';

export class DiscordConnector extends BaseConnector {
  readonly type = 'discord';
  readonly name = 'Discord';
  readonly description = 'Send messages to Discord channels';
  
  readonly actions: ConnectorAction[] = [
    {
      name: 'send_message',
      description: 'Send a message to a Discord channel',
      inputSchema: {
        channel_id: { type: 'string', required: true, description: 'Discord channel ID' },
        content: { type: 'string', required: false, description: 'Message content' },
        embeds: { type: 'array', required: false, description: 'Rich embeds' },
        username: { type: 'string', required: false, description: 'Override username (webhook only)' },
        avatar_url: { type: 'string', required: false, description: 'Override avatar (webhook only)' },
      },
      outputSchema: {
        id: { type: 'string' },
        channel_id: { type: 'string' },
      },
    },
    {
      name: 'send_webhook',
      description: 'Send a message via Discord webhook',
      inputSchema: {
        webhook_url: { type: 'string', required: true },
        content: { type: 'string', required: false },
        embeds: { type: 'array', required: false },
        username: { type: 'string', required: false },
        avatar_url: { type: 'string', required: false },
      },
      outputSchema: {
        success: { type: 'boolean' },
      },
    },
    {
      name: 'edit_message',
      description: 'Edit a Discord message',
      inputSchema: {
        channel_id: { type: 'string', required: true },
        message_id: { type: 'string', required: true },
        content: { type: 'string', required: false },
        embeds: { type: 'array', required: false },
      },
      outputSchema: {
        id: { type: 'string' },
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

      switch (action) {
        case 'send_message':
          return await this.sendMessage(config.credentialId ? await this.getCredentials(config.credentialId, context.userId || '') : null, interpolatedConfig);
        case 'send_webhook':
          return await this.sendWebhook(interpolatedConfig);
        case 'edit_message':
          return await this.editMessage(config.credentialId ? await this.getCredentials(config.credentialId, context.userId || '') : null, interpolatedConfig);
        default:
          return this.createErrorResult(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      return this.createErrorResult(error.message || 'Discord connector failed');
    }
  }

  private async sendMessage(credentials: Record<string, any> | null, config: ConnectorConfig): Promise<StepResult> {
    if (!credentials?.bot_token) {
      return this.createErrorResult('Discord bot token not found in credentials');
    }

    const response = await axios.post(
      `https://discord.com/api/v10/channels/${config.channel_id}/messages`,
      {
        content: config.content,
        embeds: config.embeds,
      },
      {
        headers: {
          'Authorization': `Bot ${credentials.bot_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return this.createSuccessResult(response.data);
  }

  private async sendWebhook(config: ConnectorConfig): Promise<StepResult> {
    if (!config.webhook_url) {
      return this.createErrorResult('Discord webhook URL is required');
    }

    await axios.post(
      config.webhook_url,
      {
        content: config.content,
        embeds: config.embeds,
        username: config.username,
        avatar_url: config.avatar_url,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return this.createSuccessResult({ success: true });
  }

  private async editMessage(credentials: Record<string, any> | null, config: ConnectorConfig): Promise<StepResult> {
    if (!credentials?.bot_token) {
      return this.createErrorResult('Discord bot token not found in credentials');
    }

    const response = await axios.patch(
      `https://discord.com/api/v10/channels/${config.channel_id}/messages/${config.message_id}`,
      {
        content: config.content,
        embeds: config.embeds,
      },
      {
        headers: {
          'Authorization': `Bot ${credentials.bot_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return this.createSuccessResult(response.data);
  }
}

export const discordConnector = new DiscordConnector();
