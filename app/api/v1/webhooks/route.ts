import { NextRequest } from 'next/server';

import {
  ApiError,
  handleApiError,
  jsonError,
  jsonOk,
  readJsonBody,
} from '@/lib/api/route-helpers';
import { verifyApiKey } from '@/lib/middleware/auth';
import { webhookService } from '@/lib/services/webhook.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return jsonError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const webhooks = await webhookService.findByWorkspace(auth.workspaceId);
    return jsonOk(webhooks);
  } catch (error) {
    return handleApiError(error, 'GET /api/v1/webhooks');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return jsonError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await readJsonBody<any>(request);
    const { name, description, url, events, headers, retryPolicy } = body;

    if (!name || !url || !events || !Array.isArray(events)) {
      throw new ApiError(
        'Missing required fields: name, url, events',
        400,
        'VALIDATION_ERROR',
      );
    }

    const webhook = await webhookService.create({
      workspaceId: auth.workspaceId,
      name,
      description,
      url,
      events,
      headers,
      retryPolicy,
    });

    return jsonOk(webhook, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/v1/webhooks');
  }
}
