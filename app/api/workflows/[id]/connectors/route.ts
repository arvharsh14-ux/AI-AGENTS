import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { workflowService } from '@/lib/services/workflow.service';
import { billingService } from '@/lib/services/billing.service';
import { createHttpConnectorConfig } from '@/lib/connectors/http';
import type { HttpConnectorInstanceConfig } from '@/lib/connectors/http.types';

function toPublicConfig(config: HttpConnectorInstanceConfig) {
  const auth = config.auth;

  if (auth.type === 'none') return { baseUrl: config.baseUrl, auth: { type: 'none' } };
  if (auth.type === 'api_key') {
    return {
      baseUrl: config.baseUrl,
      auth: {
        type: 'api_key',
        headerName: auth.headerName,
        apiKeyLast4: auth.apiKeyLast4,
      },
    };
  }
  if (auth.type === 'bearer_token') {
    return {
      baseUrl: config.baseUrl,
      auth: {
        type: 'bearer_token',
        tokenLast4: auth.tokenLast4,
      },
    };
  }

  return {
    baseUrl: config.baseUrl,
    auth: {
      type: 'basic',
      username: auth.username,
      passwordLast4: auth.passwordLast4,
    },
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflow = await workflowService.getWorkflow(params.id);

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (workflow.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const connectors = await prisma.connectorInstance.findMany({
      where: { workflowId: workflow.id },
      orderBy: { createdAt: 'asc' },
    });

    const publicConnectors = connectors.map((c) => ({
      id: c.id,
      name: c.name,
      connectorType: c.connectorType,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      config: toPublicConfig(c.config as unknown as HttpConnectorInstanceConfig),
    }));

    return NextResponse.json({ connectors: publicConnectors });
  } catch (error: any) {
    console.error('Failed to list connectors:', error);
    return NextResponse.json({ error: 'Failed to list connectors' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflow = await workflowService.getWorkflow(params.id);

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (workflow.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await billingService.assertCanCreateConnector(session.user.id, workflow.id);

    const body = await request.json();
    const { name, connectorType, config } = body as {
      name?: string;
      connectorType?: string;
      config?: any;
    };

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (connectorType !== 'http') {
      return NextResponse.json(
        { error: 'Only http connectors are supported' },
        { status: 400 }
      );
    }

    if (!config?.baseUrl) {
      return NextResponse.json(
        { error: 'config.baseUrl is required' },
        { status: 400 }
      );
    }

    const authType = config.authType || 'none';

    const connectorConfig = createHttpConnectorConfig({
      baseUrl: config.baseUrl,
      auth:
        authType === 'api_key'
          ? { type: 'api_key', headerName: config.headerName || 'X-API-Key', apiKey: config.apiKey || '' }
          : authType === 'bearer_token'
            ? { type: 'bearer_token', token: config.token || '' }
            : authType === 'basic'
              ? { type: 'basic', username: config.username || '', password: config.password || '' }
              : { type: 'none' },
    });

    if (connectorConfig.auth.type === 'api_key' && !config.apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    if (connectorConfig.auth.type === 'bearer_token' && !config.token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    if (connectorConfig.auth.type === 'basic' && (!config.username || !config.password)) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const connector = await prisma.connectorInstance.create({
      data: {
        workflowId: workflow.id,
        name,
        connectorType: 'http',
        config: connectorConfig as any,
      },
    });

    return NextResponse.json(
      {
        connector: {
          id: connector.id,
          name: connector.name,
          connectorType: connector.connectorType,
          createdAt: connector.createdAt,
          updatedAt: connector.updatedAt,
          config: toPublicConfig(connector.config as unknown as HttpConnectorInstanceConfig),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    const message = error?.message || 'Failed to create connector';

    if (message.includes('Free plan limit')) {
      return NextResponse.json(
        { error: message, code: 'PLAN_LIMIT' },
        { status: 402 }
      );
    }

    console.error('Failed to create connector:', error);
    return NextResponse.json({ error: 'Failed to create connector' }, { status: 500 });
  }
}
