export const postmanCollection = {
  info: {
    name: 'AI Agents Workflow API',
    description: 'Complete API collection for AI Agents platform',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  auth: {
    type: 'bearer',
    bearer: [
      {
        key: 'token',
        value: '{{API_KEY}}',
        type: 'string',
      },
    ],
  },
  variable: [
    {
      key: 'BASE_URL',
      value: 'http://localhost:3000/api/v1',
      type: 'string',
    },
    {
      key: 'API_KEY',
      value: 'sk_your_api_key_here',
      type: 'string',
    },
  ],
  item: [
    {
      name: 'Workflows',
      item: [
        {
          name: 'List Workflows',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{BASE_URL}}/workflows',
              host: ['{{BASE_URL}}'],
              path: ['workflows'],
            },
          },
        },
        {
          name: 'Create Workflow',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                name: 'New Workflow',
                description: 'Workflow created via API',
                definition: {
                  steps: [
                    {
                      name: 'step1',
                      type: 'http_request',
                      config: {
                        method: 'GET',
                        url: 'https://api.example.com/data',
                      },
                    },
                  ],
                },
              }, null, 2),
            },
            url: {
              raw: '{{BASE_URL}}/workflows',
              host: ['{{BASE_URL}}'],
              path: ['workflows'],
            },
          },
        },
        {
          name: 'Get Workflow',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{BASE_URL}}/workflows/:id',
              host: ['{{BASE_URL}}'],
              path: ['workflows', ':id'],
              variable: [{ key: 'id', value: 'workflow_id' }],
            },
          },
        },
        {
          name: 'Execute Workflow',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                input: {
                  key: 'value',
                },
              }, null, 2),
            },
            url: {
              raw: '{{BASE_URL}}/workflows/:id/execute',
              host: ['{{BASE_URL}}'],
              path: ['workflows', ':id', 'execute'],
              variable: [{ key: 'id', value: 'workflow_id' }],
            },
          },
        },
      ],
    },
    {
      name: 'Credentials',
      item: [
        {
          name: 'List Credentials',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{BASE_URL}}/credentials',
              host: ['{{BASE_URL}}'],
              path: ['credentials'],
            },
          },
        },
        {
          name: 'Create Credential',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                name: 'Slack Bot Token',
                description: 'Production Slack bot',
                type: 'oauth',
                provider: 'slack',
                data: {
                  bot_token: 'xoxb-xxxxxxxxxxxxx',
                },
                metadata: {
                  scopes: ['chat:write', 'channels:read'],
                },
              }, null, 2),
            },
            url: {
              raw: '{{BASE_URL}}/credentials',
              host: ['{{BASE_URL}}'],
              path: ['credentials'],
            },
          },
        },
      ],
    },
    {
      name: 'Webhooks',
      item: [
        {
          name: 'List Webhooks',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{BASE_URL}}/webhooks',
              host: ['{{BASE_URL}}'],
              path: ['webhooks'],
            },
          },
        },
        {
          name: 'Create Webhook',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                name: 'Workflow Completed Hook',
                url: 'https://your-app.com/webhook',
                events: ['workflow.completed', 'workflow.failed'],
                retryPolicy: {
                  maxAttempts: 3,
                  backoffMs: 1000,
                },
              }, null, 2),
            },
            url: {
              raw: '{{BASE_URL}}/webhooks',
              host: ['{{BASE_URL}}'],
              path: ['webhooks'],
            },
          },
        },
        {
          name: 'Get Webhook Deliveries',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{BASE_URL}}/webhooks/:id/deliveries?limit=50',
              host: ['{{BASE_URL}}'],
              path: ['webhooks', ':id', 'deliveries'],
              query: [{ key: 'limit', value: '50' }],
              variable: [{ key: 'id', value: 'webhook_id' }],
            },
          },
        },
      ],
    },
    {
      name: 'Connectors',
      item: [
        {
          name: 'List Available Connectors',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{BASE_URL}}/connectors?available=true',
              host: ['{{BASE_URL}}'],
              path: ['connectors'],
              query: [{ key: 'available', value: 'true' }],
            },
          },
        },
        {
          name: 'List My Connectors',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{BASE_URL}}/connectors',
              host: ['{{BASE_URL}}'],
              path: ['connectors'],
            },
          },
        },
        {
          name: 'Create Connector',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                name: 'Production Slack',
                type: 'slack',
                credentialId: 'cred_123',
                config: {
                  defaultChannel: '#general',
                },
              }, null, 2),
            },
            url: {
              raw: '{{BASE_URL}}/connectors',
              host: ['{{BASE_URL}}'],
              path: ['connectors'],
            },
          },
        },
      ],
    },
    {
      name: 'Executions',
      item: [
        {
          name: 'Get Execution',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{BASE_URL}}/executions/:id',
              host: ['{{BASE_URL}}'],
              path: ['executions', ':id'],
              variable: [{ key: 'id', value: 'execution_id' }],
            },
          },
        },
        {
          name: 'Cancel Execution',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                action: 'cancel',
              }, null, 2),
            },
            url: {
              raw: '{{BASE_URL}}/executions/:id',
              host: ['{{BASE_URL}}'],
              path: ['executions', ':id'],
              variable: [{ key: 'id', value: 'execution_id' }],
            },
          },
        },
      ],
    },
    {
      name: 'OpenAPI',
      item: [
        {
          name: 'Get OpenAPI Spec',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{BASE_URL}}/openapi',
              host: ['{{BASE_URL}}'],
              path: ['openapi'],
            },
          },
        },
      ],
    },
  ],
};
