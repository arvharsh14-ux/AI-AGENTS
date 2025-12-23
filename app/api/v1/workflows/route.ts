import { NextRequest } from 'next/server';

import {
  ApiError,
  handleApiError,
  jsonError,
  jsonOk,
  readJsonBody,
} from '@/lib/api/route-helpers';
import { verifyApiKey } from '@/lib/middleware/auth';
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit';
import { workflowService } from '@/lib/services/workflow.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return jsonError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const rateLimit = await rateLimitMiddleware(request, `api:${auth.apiKeyId}`, {
      windowMs: 60000,
      maxRequests: 100,
    });

    if (!rateLimit.allowed) {
      return jsonError('Rate limit exceeded', 429, 'RATE_LIMITED', {
        headers: rateLimit.headers,
      });
    }

    const workflows = await workflowService.listWorkflows('api-key');

    return jsonOk(workflows, { headers: rateLimit.headers });
  } catch (error) {
    return handleApiError(error, 'GET /api/v1/workflows');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return jsonError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const rateLimit = await rateLimitMiddleware(request, `api:${auth.apiKeyId}`, {
      windowMs: 60000,
      maxRequests: 100,
    });

    if (!rateLimit.allowed) {
      return jsonError('Rate limit exceeded', 429, 'RATE_LIMITED', {
        headers: rateLimit.headers,
      });
    }

    const body = await readJsonBody<any>(request);
    const { name, description, definition, isPublic } = body;

    if (!name) {
      throw new ApiError('Missing required field: name', 400, 'VALIDATION_ERROR');
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

    return jsonOk(workflow, { status: 201, headers: rateLimit.headers });
  } catch (error) {
    return handleApiError(error, 'POST /api/v1/workflows');
  }
}
