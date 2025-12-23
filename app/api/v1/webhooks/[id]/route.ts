import { NextRequest } from 'next/server';

import { handleApiError, jsonError, jsonOk, readJsonBody } from '@/lib/api/route-helpers';
import { verifyApiKey } from '@/lib/middleware/auth';
import { webhookService } from '@/lib/services/webhook.service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return jsonError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const webhook = await webhookService.findById(params.id);

    if (!webhook) {
      return jsonError('Webhook not found', 404, 'NOT_FOUND');
    }

    if (webhook.workspaceId !== auth.workspaceId) {
      return jsonError('Forbidden', 403, 'FORBIDDEN');
    }

    return jsonOk(webhook);
  } catch (error) {
    return handleApiError(error, 'GET /api/v1/webhooks/:id');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return jsonError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const webhook = await webhookService.findById(params.id);

    if (!webhook) {
      return jsonError('Webhook not found', 404, 'NOT_FOUND');
    }

    if (webhook.workspaceId !== auth.workspaceId) {
      return jsonError('Forbidden', 403, 'FORBIDDEN');
    }

    const body = await readJsonBody<any>(request);
    const updated = await webhookService.update(params.id, body);

    return jsonOk(updated);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/v1/webhooks/:id');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return jsonError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const webhook = await webhookService.findById(params.id);

    if (!webhook) {
      return jsonError('Webhook not found', 404, 'NOT_FOUND');
    }

    if (webhook.workspaceId !== auth.workspaceId) {
      return jsonError('Forbidden', 403, 'FORBIDDEN');
    }

    await webhookService.delete(params.id);

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/v1/webhooks/:id');
  }
}
