import nodemailer from 'nodemailer';
import { BaseConnector, ConnectorAction, ConnectorConfig } from './base-connector';
import { interpolateVariables } from '@/lib/workflow/interpolation';
import type { ExecutionContext, StepResult } from '@/lib/types/workflow.types';

export class SmtpConnector extends BaseConnector {
  readonly type = 'smtp';
  readonly name = 'SMTP / Email';
  readonly description = 'Send emails via SMTP';
  
  readonly actions: ConnectorAction[] = [
    {
      name: 'send_email',
      description: 'Send an email via SMTP',
      inputSchema: {
        to: { type: 'string', required: true, description: 'Recipient email address' },
        subject: { type: 'string', required: true, description: 'Email subject' },
        text: { type: 'string', required: false, description: 'Plain text body' },
        html: { type: 'string', required: false, description: 'HTML body' },
        from: { type: 'string', required: false, description: 'Sender email (defaults to credential)' },
        cc: { type: 'string', required: false, description: 'CC recipients' },
        bcc: { type: 'string', required: false, description: 'BCC recipients' },
        attachments: { type: 'array', required: false, description: 'Email attachments' },
      },
      outputSchema: {
        messageId: { type: 'string' },
        response: { type: 'string' },
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
        return this.createErrorResult('SMTP credential not configured');
      }

      const credentials = await this.getCredentials(config.credentialId, context.userId || '');

      if (!credentials.host || !credentials.port) {
        return this.createErrorResult('SMTP host and port are required in credentials');
      }

      const interpolatedConfig = interpolateVariables(config, {
        input: context.input,
        variables: context.variables,
        metadata: context.metadata,
      }) as ConnectorConfig;

      switch (action) {
        case 'send_email':
          return await this.sendEmail(credentials, interpolatedConfig);
        default:
          return this.createErrorResult(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      return this.createErrorResult(error.message || 'SMTP connector failed');
    }
  }

  private async sendEmail(credentials: Record<string, any>, config: ConnectorConfig): Promise<StepResult> {
    const transporter = nodemailer.createTransport({
      host: credentials.host,
      port: credentials.port,
      secure: credentials.secure !== false,
      auth: credentials.user && credentials.password ? {
        user: credentials.user,
        pass: credentials.password,
      } : undefined,
    });

    const info = await transporter.sendMail({
      from: config.from || credentials.from || credentials.user,
      to: config.to,
      subject: config.subject,
      text: config.text,
      html: config.html,
      cc: config.cc,
      bcc: config.bcc,
      attachments: config.attachments,
    });

    return this.createSuccessResult({
      messageId: info.messageId,
      response: info.response,
    });
  }
}

export const smtpConnector = new SmtpConnector();
