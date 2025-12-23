import { NextRequest } from 'next/server';

import { handleApiError, jsonError, jsonOk, readJsonBody } from '@/lib/api/route-helpers';
import { verifyApiKey } from '@/lib/middleware/auth';
import { credentialService } from '@/lib/services/credential.service';

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

    const credential = await credentialService.findById(params.id);

    if (!credential) {
      return jsonError('Credential not found', 404, 'NOT_FOUND');
    }

    if (credential.workspaceId !== auth.workspaceId) {
      return jsonError('Forbidden', 403, 'FORBIDDEN');
    }

    return jsonOk({
      id: credential.id,
      name: credential.name,
      description: credential.description,
      type: credential.type,
      provider: credential.provider,
      metadata: credential.metadata,
      lastRotatedAt: credential.lastRotatedAt,
      expiresAt: credential.expiresAt,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/v1/credentials/:id');
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

    const credential = await credentialService.findById(params.id);

    if (!credential) {
      return jsonError('Credential not found', 404, 'NOT_FOUND');
    }

    if (credential.workspaceId !== auth.workspaceId) {
      return jsonError('Forbidden', 403, 'FORBIDDEN');
    }

    const body = await readJsonBody<any>(request);
    const updated = await credentialService.update(params.id, body, 'api-key');

    return jsonOk({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      type: updated.type,
      provider: updated.provider,
      metadata: updated.metadata,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    return handleApiError(error, 'PATCH /api/v1/credentials/:id');
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

    const credential = await credentialService.findById(params.id);

    if (!credential) {
      return jsonError('Credential not found', 404, 'NOT_FOUND');
    }

    if (credential.workspaceId !== auth.workspaceId) {
      return jsonError('Forbidden', 403, 'FORBIDDEN');
    }

    await credentialService.delete(params.id, 'api-key');

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/v1/credentials/:id');
  }
}
