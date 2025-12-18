# Connectors Guide

## Overview

Connectors provide pre-built integrations with popular services and platforms. Each connector includes multiple actions that can be used in your workflows.

## Available Connectors

### Slack

Send messages and interact with Slack workspaces.

**Type:** `slack`  
**Credential Type:** OAuth  
**Provider:** `slack`

#### Required Credentials

```json
{
  "bot_token": "xoxb-xxxxxxxxxxxxx"
}
```

#### Actions

##### send_message

Send a message to a Slack channel or user.

```json
{
  "connectorType": "slack",
  "action": "send_message",
  "credentialId": "cred_123",
  "channel": "#general",
  "text": "Hello from workflow!",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Bold text* and _italic text_"
      }
    }
  ]
}
```

##### update_message

Update an existing Slack message.

```json
{
  "connectorType": "slack",
  "action": "update_message",
  "credentialId": "cred_123",
  "channel": "#general",
  "ts": "1234567890.123456",
  "text": "Updated message"
}
```

##### add_reaction

Add an emoji reaction to a message.

```json
{
  "connectorType": "slack",
  "action": "add_reaction",
  "credentialId": "cred_123",
  "channel": "#general",
  "timestamp": "1234567890.123456",
  "name": "thumbsup"
}
```

### SMTP / Email

Send emails via SMTP.

**Type:** `smtp`  
**Credential Type:** Custom

#### Required Credentials

```json
{
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": true,
  "user": "your-email@gmail.com",
  "password": "your-app-password",
  "from": "Your Name <your-email@gmail.com>"
}
```

#### Actions

##### send_email

Send an email.

```json
{
  "connectorType": "smtp",
  "action": "send_email",
  "credentialId": "cred_123",
  "to": "recipient@example.com",
  "subject": "Workflow Notification",
  "html": "<h1>Hello!</h1><p>Your workflow completed successfully.</p>",
  "text": "Hello! Your workflow completed successfully.",
  "cc": "manager@example.com",
  "attachments": [
    {
      "filename": "report.pdf",
      "path": "/path/to/report.pdf"
    }
  ]
}
```

### Stripe

Interact with Stripe payment platform.

**Type:** `stripe`  
**Credential Type:** API Key  
**Provider:** `stripe`

#### Required Credentials

```json
{
  "secret_key": "sk_test_xxxxxxxxxxxxx"
}
```

#### Actions

##### create_customer

Create a new Stripe customer.

```json
{
  "connectorType": "stripe",
  "action": "create_customer",
  "credentialId": "cred_123",
  "email": "customer@example.com",
  "name": "John Doe",
  "metadata": {
    "userId": "user_123"
  }
}
```

##### create_invoice

Create an invoice.

```json
{
  "connectorType": "stripe",
  "action": "create_invoice",
  "credentialId": "cred_123",
  "customer": "cus_xxxxxxxxxxxxx",
  "description": "Monthly subscription",
  "auto_advance": true
}
```

##### create_invoice_item

Add an item to an invoice.

```json
{
  "connectorType": "stripe",
  "action": "create_invoice_item",
  "credentialId": "cred_123",
  "customer": "cus_xxxxxxxxxxxxx",
  "amount": 1000,
  "currency": "usd",
  "description": "Pro Plan"
}
```

##### create_payment_intent

Create a payment intent.

```json
{
  "connectorType": "stripe",
  "action": "create_payment_intent",
  "credentialId": "cred_123",
  "amount": 2000,
  "currency": "usd",
  "customer": "cus_xxxxxxxxxxxxx",
  "description": "One-time payment"
}
```

### Discord

Send messages to Discord channels.

**Type:** `discord`  
**Credential Type:** Token  
**Provider:** `discord`

#### Required Credentials (Bot)

```json
{
  "bot_token": "your-bot-token"
}
```

#### Actions

##### send_message

Send a message to a Discord channel.

```json
{
  "connectorType": "discord",
  "action": "send_message",
  "credentialId": "cred_123",
  "channel_id": "123456789012345678",
  "content": "Hello from workflow!",
  "embeds": [
    {
      "title": "Workflow Complete",
      "description": "Your workflow finished successfully",
      "color": 3066993,
      "fields": [
        {
          "name": "Status",
          "value": "Success",
          "inline": true
        }
      ]
    }
  ]
}
```

##### send_webhook

Send a message via Discord webhook (no bot required).

```json
{
  "connectorType": "discord",
  "action": "send_webhook",
  "webhook_url": "https://discord.com/api/webhooks/...",
  "content": "Hello!",
  "username": "Custom Bot Name",
  "avatar_url": "https://example.com/avatar.png"
}
```

### HTTP

Make authenticated HTTP requests.

**Type:** `http`  
**Credential Type:** Custom

#### Credential Options

**Bearer Token:**
```json
{
  "type": "bearer",
  "token": "your-token"
}
```

**Basic Auth:**
```json
{
  "type": "basic",
  "username": "user",
  "password": "pass"
}
```

**API Key:**
```json
{
  "type": "api_key",
  "api_key": "your-key",
  "header": "X-API-Key"
}
```

#### Actions

##### request

Make an HTTP request with authentication.

```json
{
  "connectorType": "http",
  "action": "request",
  "credentialId": "cred_123",
  "method": "POST",
  "url": "https://api.example.com/data",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "key": "value"
  },
  "params": {
    "filter": "active"
  },
  "timeout": 30000
}
```

## Using Connectors in Workflows

### Basic Example

```json
{
  "steps": [
    {
      "name": "send_slack_notification",
      "type": "connector",
      "config": {
        "connectorType": "slack",
        "action": "send_message",
        "credentialId": "cred_slack_prod",
        "channel": "#notifications",
        "text": "Workflow completed!"
      }
    }
  ]
}
```

### With Variable Interpolation

```json
{
  "steps": [
    {
      "name": "fetch_data",
      "type": "http_request",
      "config": {
        "method": "GET",
        "url": "https://api.example.com/users/123"
      }
    },
    {
      "name": "send_email",
      "type": "connector",
      "config": {
        "connectorType": "smtp",
        "action": "send_email",
        "credentialId": "cred_smtp",
        "to": "{{fetch_data.data.email}}",
        "subject": "Hello {{fetch_data.data.name}}",
        "html": "<p>Your account balance is ${{fetch_data.data.balance}}</p>"
      }
    }
  ]
}
```

### Chaining Multiple Connectors

```json
{
  "steps": [
    {
      "name": "create_stripe_customer",
      "type": "connector",
      "config": {
        "connectorType": "stripe",
        "action": "create_customer",
        "credentialId": "cred_stripe",
        "email": "{{input.email}}",
        "name": "{{input.name}}"
      }
    },
    {
      "name": "send_slack_alert",
      "type": "connector",
      "config": {
        "connectorType": "slack",
        "action": "send_message",
        "credentialId": "cred_slack",
        "channel": "#sales",
        "text": "New customer created: {{create_stripe_customer.id}}"
      }
    },
    {
      "name": "send_welcome_email",
      "type": "connector",
      "config": {
        "connectorType": "smtp",
        "action": "send_email",
        "credentialId": "cred_smtp",
        "to": "{{input.email}}",
        "subject": "Welcome!",
        "html": "<h1>Welcome to our platform!</h1>"
      }
    }
  ]
}
```

## Testing Connectors

### Using the API

```bash
# Create a test credential
curl -X POST https://your-domain.com/api/v1/credentials \
  -H "Authorization: Bearer sk_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Slack",
    "type": "oauth",
    "provider": "slack",
    "data": {
      "bot_token": "xoxb-test"
    }
  }'

# Create a test connector
curl -X POST https://your-domain.com/api/v1/connectors \
  -H "Authorization: Bearer sk_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Slack Connector",
    "type": "slack",
    "credentialId": "cred_123"
  }'
```

### Using the Dashboard

1. Navigate to **Connectors** in the sidebar
2. Click **Add Connector**
3. Select connector type
4. Configure settings
5. Test the connection
6. Save

## Building Custom Connectors

### Connector SDK

Extend the `BaseConnector` class:

```typescript
import { BaseConnector, ConnectorAction } from '@/lib/connectors/base-connector';

export class MyCustomConnector extends BaseConnector {
  readonly type = 'my_custom';
  readonly name = 'My Custom Service';
  readonly description = 'Integration with my custom service';
  
  readonly actions: ConnectorAction[] = [
    {
      name: 'do_something',
      description: 'Perform an action',
      inputSchema: {
        param1: { type: 'string', required: true },
      },
      outputSchema: {
        result: { type: 'string' },
      },
    },
  ];

  async execute(action: string, config: any, context: any) {
    if (action === 'do_something') {
      // Your implementation
      return this.createSuccessResult({ result: 'done' });
    }
    
    return this.createErrorResult('Unknown action');
  }
}
```

### Registering Custom Connectors

Add to `lib/connectors/index.ts`:

```typescript
import { myCustomConnector } from './my-custom';

export const connectorRegistry = {
  // ... existing connectors
  my_custom: myCustomConnector,
};
```

## Security Best Practices

### Credential Management

1. **Never log sensitive data** - credentials are automatically sanitized
2. **Use separate credentials** for dev/staging/production
3. **Rotate credentials regularly** - especially after team changes
4. **Set expiration dates** - for temporary access
5. **Monitor usage** - check audit logs regularly

### API Key Scoping

When creating credentials via API, use the principle of least privilege:

```json
{
  "permissions": {
    "workflows:read": true,
    "workflows:execute": true,
    "credentials:read": false
  }
}
```

### Webhook Security

1. **Always verify signatures** - prevent spoofed requests
2. **Use HTTPS** - for webhook URLs
3. **Implement rate limiting** - on webhook receivers
4. **Log all deliveries** - for debugging and auditing

## Troubleshooting

### Common Issues

**Connector fails with "Unauthorized":**
- Check credential validity
- Verify API keys/tokens haven't expired
- Ensure proper scopes/permissions

**Timeout errors:**
- Increase timeout value in config
- Check network connectivity
- Verify service availability

**Rate limiting:**
- Implement exponential backoff
- Use batch operations when available
- Contact service provider for limit increases

### Debugging

Enable detailed logging:

```json
{
  "name": "debug_step",
  "type": "connector",
  "config": {
    "connectorType": "http",
    "action": "request",
    "method": "GET",
    "url": "https://api.example.com/debug"
  }
}
```

Check execution logs for details:

```bash
curl -X GET https://your-domain.com/api/v1/executions/exec_123 \
  -H "Authorization: Bearer sk_xxxxx"
```

## Support

For additional help:
- Review the [Integration API Documentation](./INTEGRATION_API.md)
- Check [Workflow Examples](./WORKFLOW_EXAMPLES.md)
- Open an issue on GitHub
- Contact support@example.com
