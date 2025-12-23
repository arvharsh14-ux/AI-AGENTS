import { NextRequest } from 'next/server';

import {
  ApiError,
  handleApiError,
  jsonError,
  jsonOk,
  readJsonBody,
} from '@/lib/api/route-helpers';
import { verifyApiKey } from '@/lib/middleware/auth';
import { credentialService } from '@/lib/services/credential.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return jsonError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const credentials = await credentialService.findByWorkspace(auth.workspaceId);

    const sanitized = credentials.map((cred) => ({
      id: cred.id,
      name: cred.name,
      description: cred.description,
      type: cred.type,
      provider: cred.provider,
      metadata: cred.metadata,
      lastRotatedAt: cred.lastRotatedAt,
      expiresAt: cred.expiresAt,
      createdAt: cred.createdAt,
      updatedAt: cred.updatedAt,
    }));

    return jsonOk(sanitized);
  } catch (error) {
    return handleApiError(error, 'GET /api/v1/credentials');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return jsonError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await readJsonBody<any>(request);
    const {
      name,
      description,
      type,
      provider,
      data,
      metadata,
      rotationPolicy,
      expiresAt,
    } = body;

    if (!name || !type || !data) {
      throw new ApiError(
        'Missing required fields: name, type, data',
        400,
        'VALIDATION_ERROR',
      );
    }

    const credential = await credentialService.create({
      workspaceId: auth.workspaceId,
      name,
      description,
      type,
      provider,
      data,
      metadata,
      rotationPolicy,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: 'api-key',
    });

    return jsonOk(
      {
        id: credential.id,
        name: credential.name,
        description: credential.description,
        type: credential.type,
        provider: credential.provider,
        metadata: credential.metadata,
        createdAt: credential.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/v1/credentials');
  }
}
