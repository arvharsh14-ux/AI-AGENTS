import { NextRequest } from 'next/server';

import {
  ApiError,
  handleApiError,
  jsonError,
  jsonOk,
  readJsonBody,
} from '@/lib/api/route-helpers';
import { connectorRegistry } from '@/lib/connectors';
import { verifyApiKey } from '@/lib/middleware/auth';
import { connectorService } from '@/lib/services/connector.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return jsonError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const searchParams = request.nextUrl.searchParams;
    const showAvailable = searchParams.get('available') === 'true';

    if (showAvailable) {
      const available = Object.values(connectorRegistry).map((connector) => ({
        type: connector.type,
        name: connector.name,
        description: connector.description,
        actions: connector.actions,
      }));

      return jsonOk(available);
    }

    const connectors = await connectorService.findByWorkspace(auth.workspaceId);
    return jsonOk(connectors);
  } catch (error) {
    return handleApiError(error, 'GET /api/v1/connectors');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return jsonError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await readJsonBody<any>(request);
    const { name, type, description, config, credentialId } = body;

    if (!name || !type) {
      throw new ApiError(
        'Missing required fields: name, type',
        400,
        'VALIDATION_ERROR',
      );
    }

    const connector = await connectorService.create({
      workspaceId: auth.workspaceId,
      name,
      type,
      description,
      config: config || {},
      credentialId,
    });

    return jsonOk(connector, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/v1/connectors');
  }
}
