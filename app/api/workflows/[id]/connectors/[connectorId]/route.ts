import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { workflowService } from '@/lib/services/workflow.service';
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; connectorId: string } }
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

    const existing = await prisma.connectorInstance.findFirst({
      where: { id: params.connectorId, workflowId: workflow.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, config } = body as { name?: string; config?: any };

    if (existing.connectorType !== 'http') {
      return NextResponse.json(
        { error: 'Only http connectors are supported' },
        { status: 400 }
      );
    }

    const currentConfig = existing.config as unknown as HttpConnectorInstanceConfig;

    const nextConfigInput = {
      baseUrl: config?.baseUrl || currentConfig.baseUrl,
      auth: config?.authType
        ? config.authType === 'api_key'
          ? {
              type: 'api_key' as const,
              headerName: config.headerName || 'X-API-Key',
              apiKey: config.apiKey || '',
            }
          : config.authType === 'bearer_token'
            ? { type: 'bearer_token' as const, token: config.token || '' }
            : config.authType === 'basic'
              ? {
                  type: 'basic' as const,
                  username: config.username || '',
                  password: config.password || '',
                }
              : { type: 'none' as const }
        : (() => {
            const auth = currentConfig.auth;
            if (auth.type === 'none') return { type: 'none' as const };
            if (auth.type === 'api_key') {
              return {
                type: 'api_key' as const,
                headerName: auth.headerName,
                apiKey: config?.apiKey || '',
              };
            }
            if (auth.type === 'bearer_token') {
              return { type: 'bearer_token' as const, token: config?.token || '' };
            }
            return {
              type: 'basic' as const,
              username: auth.username,
              password: config?.password || '',
            };
          })(),
    };

    // If auth is not being updated, keep existing encrypted secrets.
    let nextConfig: HttpConnectorInstanceConfig;

    if (!config?.authType && !config?.apiKey && !config?.token && !config?.password) {
      nextConfig = {
        ...currentConfig,
        baseUrl: nextConfigInput.baseUrl,
      };
    } else {
      nextConfig = createHttpConnectorConfig(nextConfigInput);

      if (nextConfig.auth.type === 'api_key' && !nextConfigInput.auth.apiKey) {
        return NextResponse.json({ error: 'API key is required' }, { status: 400 });
      }

      if (nextConfig.auth.type === 'bearer_token' && !nextConfigInput.auth.token) {
        return NextResponse.json({ error: 'Token is required' }, { status: 400 });
      }

      if (
        nextConfig.auth.type === 'basic' &&
        (!nextConfigInput.auth.username || !nextConfigInput.auth.password)
      ) {
        return NextResponse.json(
          { error: 'Username and password are required' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.connectorInstance.update({
      where: { id: existing.id },
      data: {
        name: name ?? existing.name,
        config: nextConfig as any,
      },
    });

    return NextResponse.json({
      connector: {
        id: updated.id,
        name: updated.name,
        connectorType: updated.connectorType,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        config: toPublicConfig(updated.config as unknown as HttpConnectorInstanceConfig),
      },
    });
  } catch (error: any) {
    console.error('Failed to update connector:', error);
    return NextResponse.json({ error: 'Failed to update connector' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; connectorId: string } }
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

    const existing = await prisma.connectorInstance.findFirst({
      where: { id: params.connectorId, workflowId: workflow.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    await prisma.connectorInstance.delete({ where: { id: existing.id } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Failed to delete connector:', error);
    return NextResponse.json({ error: 'Failed to delete connector' }, { status: 500 });
  }
}
