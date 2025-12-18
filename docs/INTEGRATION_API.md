# Integration Layer API Documentation

## Overview

The AI Agents platform provides a comprehensive REST API for managing workflows, credentials, connectors, and webhooks programmatically. This document covers authentication, endpoints, rate limiting, and best practices.

## Authentication

All API requests require authentication using API keys.

### Creating an API Key

1. Log in to your account
2. Navigate to Settings > API Keys
3. Click "Create API Key"
4. Give it a name and set permissions
5. **Save the key immediately** - it will only be shown once

### Using API Keys

Include your API key in the `Authorization` header:

```bash
Authorization: Bearer sk_xxxxxxxxxxxxxxxxxxxxx
```

### Example Request

```bash
curl -X GET https://your-domain.com/api/v1/workflows \
  -H "Authorization: Bearer sk_xxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json"
```

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Default**: 100 requests per minute per API key
- Rate limit headers are included in every response:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

When rate limited, you'll receive a `429 Too Many Requests` response.

## Endpoints

### Workflows

#### List Workflows

```http
GET /api/v1/workflows
```

**Response:**
```json
[
  {
    "id": "clxyz123",
    "name": "My Workflow",
    "description": "Workflow description",
    "isPublic": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Create Workflow

```http
POST /api/v1/workflows
```

**Request Body:**
```json
{
  "name": "New Workflow",
  "description": "Optional description",
  "definition": {
    "steps": [
      {
        "name": "step1",
        "type": "http_request",
        "config": {
          "method": "GET",
          "url": "https://api.example.com/data"
        }
      }
    ]
  },
  "isPublic": false
}
```

#### Execute Workflow

```http
POST /api/v1/workflows/{id}/execute
```

**Request Body:**
```json
{
  "input": {
    "key": "value"
  }
}
```

**Response:**
```json
{
  "executionId": "exec_123",
  "status": "pending",
  "startedAt": "2024-01-01T00:00:00Z"
}
```

### Credentials

#### Create Credential

```http
POST /api/v1/credentials
```

**Request Body:**
```json
{
  "name": "Slack Bot Token",
  "description": "Production Slack bot",
  "type": "oauth",
  "provider": "slack",
  "data": {
    "bot_token": "xoxb-xxxxxxxxxxxxx",
    "app_id": "A01234567"
  },
  "metadata": {
    "scopes": ["chat:write", "channels:read"]
  }
}
```

**Note**: Credential data is encrypted at rest using AES-256-GCM.

#### List Credentials

```http
GET /api/v1/credentials
```

Returns sanitized credentials (without sensitive data).

### Webhooks

#### Create Webhook

```http
POST /api/v1/webhooks
```

**Request Body:**
```json
{
  "name": "Workflow Completed Hook",
  "url": "https://your-app.com/webhook",
  "events": ["workflow.completed", "workflow.failed"],
  "headers": {
    "X-Custom-Header": "value"
  },
  "retryPolicy": {
    "maxAttempts": 3,
    "backoffMs": 1000
  }
}
```

#### Webhook Delivery Format

When an event occurs, we'll POST to your URL:

```json
{
  "event": "workflow.completed",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "workflowId": "wf_123",
    "executionId": "exec_456",
    "status": "completed",
    "output": { ... }
  }
}
```

**Headers:**
- `X-Webhook-Signature`: HMAC-SHA256 signature
- `X-Webhook-Event`: Event type
- `X-Webhook-Delivery`: Unique delivery ID

#### Verifying Webhook Signatures

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Connectors

#### List Available Connectors

```http
GET /api/v1/connectors?available=true
```

**Response:**
```json
[
  {
    "type": "slack",
    "name": "Slack",
    "description": "Send messages to Slack channels",
    "actions": [
      {
        "name": "send_message",
        "description": "Send a message to a channel",
        "inputSchema": { ... },
        "outputSchema": { ... }
      }
    ]
  }
]
```

#### Create Connector Instance

```http
POST /api/v1/connectors
```

**Request Body:**
```json
{
  "name": "Production Slack",
  "type": "slack",
  "credentialId": "cred_123",
  "config": {
    "defaultChannel": "#general"
  }
}
```

### Executions

#### Get Execution Status

```http
GET /api/v1/executions/{id}
```

#### Cancel Execution

```http
POST /api/v1/executions/{id}
```

**Request Body:**
```json
{
  "action": "cancel"
}
```

## Available Connectors

### Slack

**Actions:**
- `send_message` - Send message to channel
- `update_message` - Update existing message
- `add_reaction` - Add emoji reaction

**Credential Type:** `oauth`
**Required Fields:** `bot_token`

### SMTP/Email

**Actions:**
- `send_email` - Send email via SMTP

**Credential Type:** `custom`
**Required Fields:** `host`, `port`, `user`, `password`

### Stripe

**Actions:**
- `create_customer` - Create Stripe customer
- `create_invoice` - Create invoice
- `create_invoice_item` - Add item to invoice
- `create_payment_intent` - Create payment intent
- `retrieve_customer` - Get customer details

**Credential Type:** `api_key`
**Required Fields:** `secret_key`

### Discord

**Actions:**
- `send_message` - Send message to channel
- `send_webhook` - Send via webhook
- `edit_message` - Edit existing message

**Credential Type:** `token`
**Required Fields:** `bot_token` (for bot actions)

### HTTP

**Actions:**
- `request` - Make authenticated HTTP request

**Credential Type:** `custom`
**Supported Auth:** Bearer token, Basic auth, API key

## Error Handling

All errors return a JSON response with an `error` field:

```json
{
  "error": "Error message here"
}
```

**Common Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Best Practices

### Security

1. **Never commit API keys** to version control
2. **Rotate keys regularly** - especially after team member departures
3. **Use scoped permissions** - grant minimum required access
4. **Verify webhook signatures** - prevent spoofing attacks
5. **Use HTTPS** - for all API requests

### Performance

1. **Implement retry logic** with exponential backoff
2. **Cache responses** when appropriate
3. **Use pagination** for large result sets
4. **Monitor rate limits** - track remaining requests
5. **Batch operations** when possible

### Monitoring

1. **Log API responses** for debugging
2. **Set up alerts** for failed executions
3. **Monitor webhook deliveries** - retry if needed
4. **Track credential expiration** - rotate before expiry

## OpenAPI Specification

The full OpenAPI 3.0 specification is available at:

```
GET /api/v1/openapi
```

You can import this into:
- Postman (generate collection)
- Swagger UI (interactive docs)
- Code generators (generate SDKs)

## SDK Examples

### TypeScript/JavaScript

```typescript
const API_KEY = 'sk_xxxxxxxxxxxxxxxxxxxxx';
const BASE_URL = 'https://your-domain.com/api/v1';

async function executeWorkflow(workflowId: string, input: any) {
  const response = await fetch(`${BASE_URL}/workflows/${workflowId}/execute`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  return response.json();
}
```

### Python

```python
import requests

API_KEY = 'sk_xxxxxxxxxxxxxxxxxxxxx'
BASE_URL = 'https://your-domain.com/api/v1'

def execute_workflow(workflow_id, input_data):
    response = requests.post(
        f'{BASE_URL}/workflows/{workflow_id}/execute',
        headers={
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json',
        },
        json={'input': input_data}
    )
    response.raise_for_status()
    return response.json()
```

### cURL

```bash
# Execute workflow
curl -X POST https://your-domain.com/api/v1/workflows/wf_123/execute \
  -H "Authorization: Bearer sk_xxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"input": {"name": "John"}}'

# Check execution status
curl -X GET https://your-domain.com/api/v1/executions/exec_456 \
  -H "Authorization: Bearer sk_xxxxxxxxxxxxxxxxxxxxx"
```

## Support

For additional help:
- Check the [Workflow Engine Documentation](./WORKFLOW_ENGINE.md)
- Review [Connector Examples](./CONNECTOR_EXAMPLES.md)
- Open an issue on GitHub
- Contact support@example.com
