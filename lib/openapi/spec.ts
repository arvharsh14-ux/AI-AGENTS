export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'AI Agents Workflow API',
    version: '1.0.0',
    description: 'REST API for managing workflows, credentials, connectors, and webhooks',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
  },
  servers: [
    {
      url: process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/v1` : 'http://localhost:3000/api/v1',
      description: 'Production server',
    },
  ],
  security: [
    {
      BearerAuth: [],
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API Key',
        description: 'Enter your API key in the format: Bearer sk_xxxxx',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
      Workflow: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          isPublic: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Credential: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          type: { type: 'string', enum: ['oauth', 'api_key', 'basic_auth', 'token', 'custom'] },
          provider: { type: 'string', nullable: true },
          metadata: { type: 'object' },
          lastRotatedAt: { type: 'string', format: 'date-time', nullable: true },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Webhook: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          url: { type: 'string' },
          events: { type: 'array', items: { type: 'string' } },
          enabled: { type: 'boolean' },
          lastTriggeredAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Connector: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
          description: { type: 'string', nullable: true },
          config: { type: 'object' },
          enabled: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Execution: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed', 'cancelled'] },
          input: { type: 'object' },
          output: { type: 'object', nullable: true },
          error: { type: 'string', nullable: true },
          startedAt: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
          durationMs: { type: 'number', nullable: true },
        },
      },
    },
  },
  paths: {
    '/workflows': {
      get: {
        summary: 'List workflows',
        tags: ['Workflows'],
        responses: {
          '200': {
            description: 'List of workflows',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Workflow' },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Create workflow',
        tags: ['Workflows'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  definition: { type: 'object' },
                  isPublic: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Workflow created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Workflow' },
              },
            },
          },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/workflows/{id}': {
      get: {
        summary: 'Get workflow',
        tags: ['Workflows'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Workflow details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Workflow' },
              },
            },
          },
          '404': { description: 'Not found' },
        },
      },
      patch: {
        summary: 'Update workflow',
        tags: ['Workflows'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  isPublic: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Workflow updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Workflow' },
              },
            },
          },
          '404': { description: 'Not found' },
        },
      },
      delete: {
        summary: 'Delete workflow',
        tags: ['Workflows'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Workflow deleted' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/workflows/{id}/execute': {
      post: {
        summary: 'Execute workflow',
        tags: ['Workflows'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  input: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '202': {
            description: 'Execution started',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    executionId: { type: 'string' },
                    status: { type: 'string' },
                    startedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/credentials': {
      get: {
        summary: 'List credentials',
        tags: ['Credentials'],
        responses: {
          '200': {
            description: 'List of credentials',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Credential' },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create credential',
        tags: ['Credentials'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'type', 'data'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  type: { type: 'string', enum: ['oauth', 'api_key', 'basic_auth', 'token', 'custom'] },
                  provider: { type: 'string' },
                  data: { type: 'object' },
                  metadata: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Credential created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Credential' },
              },
            },
          },
        },
      },
    },
    '/webhooks': {
      get: {
        summary: 'List webhooks',
        tags: ['Webhooks'],
        responses: {
          '200': {
            description: 'List of webhooks',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Webhook' },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create webhook',
        tags: ['Webhooks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'url', 'events'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  url: { type: 'string' },
                  events: { type: 'array', items: { type: 'string' } },
                  headers: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Webhook created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Webhook' },
              },
            },
          },
        },
      },
    },
    '/connectors': {
      get: {
        summary: 'List connectors',
        tags: ['Connectors'],
        parameters: [
          {
            name: 'available',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Show available connector types',
          },
        ],
        responses: {
          '200': {
            description: 'List of connectors',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Connector' },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create connector',
        tags: ['Connectors'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'type'],
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  description: { type: 'string' },
                  config: { type: 'object' },
                  credentialId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Connector created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Connector' },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    { name: 'Workflows', description: 'Workflow management' },
    { name: 'Credentials', description: 'Credential management' },
    { name: 'Webhooks', description: 'Webhook management' },
    { name: 'Connectors', description: 'Connector management' },
    { name: 'Executions', description: 'Execution management' },
  ],
};
