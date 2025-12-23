import { NextRequest } from 'next/server';

import { handleApiError, jsonError, jsonOk } from '@/lib/api/route-helpers';
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

    const searchParams = request.nextUrl.searchParams;
    const limit = Number(searchParams.get('limit') || '50');

    const deliveries = await webhookService.getDeliveries(
      params.id,
      Number.isFinite(limit) ? limit : 50,
    );

    return jsonOk(deliveries);
  } catch (error) {
    return handleApiError(error, 'GET /api/v1/webhooks/:id/deliveries');
  }
}
