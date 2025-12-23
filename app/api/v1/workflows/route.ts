import { NextRequest, NextResponse } from 'next/server';
import { workflowService } from '@/lib/services/workflow.service';
import { verifyApiKey } from '@/lib/middleware/auth';
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await rateLimitMiddleware(request, `api:${auth.apiKeyId}`, {
      windowMs: 60000,
      maxRequests: 100,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: rateLimit.headers }
      );
    }

    // API keys don't have a userId, so list all workflows for the workspace
    // TODO: Add workspace filtering when workflows support workspaceId
    const workflows = await workflowService.listWorkflows('api-key');

    return NextResponse.json(workflows, { headers: rateLimit.headers });
  } catch (error: any) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await rateLimitMiddleware(request, `api:${auth.apiKeyId}`, {
      windowMs: 60000,
      maxRequests: 100,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: rateLimit.headers }
      );
    }

    const body = await request.json();
    const { name, description, definition, isPublic } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400, headers: rateLimit.headers }
      );
    }

    const workflow = await workflowService.createWorkflow({
      name,
      description,
      userId: 'api-key',
      isPublic: isPublic || false,
    });

    if (definition) {
      await workflowService.createVersion(workflow.id, definition);
    }

    return NextResponse.json(workflow, { status: 201, headers: rateLimit.headers });
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
