import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

import {
  ApiError,
  handleApiError,
  jsonError,
  jsonOk,
  readJsonBody,
} from '@/lib/api/route-helpers';
import { authOptions } from '@/lib/auth';
import { apiKeyService } from '@/lib/services/api-key.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return jsonError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      throw new ApiError('Missing workspaceId parameter', 400, 'VALIDATION_ERROR');
    }

    const apiKeys = await apiKeyService.findByWorkspace(workspaceId);

    const sanitized = apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      role: key.role,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      usageCount: key.usageCount,
      createdAt: key.createdAt,
    }));

    return jsonOk(sanitized);
  } catch (error) {
    return handleApiError(error, 'GET /api/v1/api-keys');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return jsonError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await readJsonBody<any>(request);
    const { workspaceId, name, role, expiresAt } = body;

    if (!workspaceId || !name) {
      throw new ApiError(
        'Missing required fields: workspaceId, name',
        400,
        'VALIDATION_ERROR',
      );
    }

    const apiKey = await apiKeyService.create({
      workspaceId,
      name,
      role: role || 'viewer',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: session.user.id,
    });

    return jsonOk(
      {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.plainKey,
        keyPrefix: apiKey.keyPrefix,
        role: apiKey.role,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
        warning: 'Save this API key now. You will not be able to see it again.',
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/v1/api-keys');
  }
}
