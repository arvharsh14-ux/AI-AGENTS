import { NextRequest } from 'next/server';

import { handleApiError, jsonError, jsonOk, readJsonBody } from '@/lib/api/route-helpers';
import { verifyApiKey } from '@/lib/middleware/auth';
import { workflowService } from '@/lib/services/workflow.service';

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

    const workflow = await workflowService.getWorkflow(params.id);

    if (!workflow) {
      return jsonError('Workflow not found', 404, 'NOT_FOUND');
    }

    return jsonOk(workflow);
  } catch (error) {
    return handleApiError(error, 'GET /api/v1/workflows/:id');
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

    const workflow = await workflowService.getWorkflow(params.id);

    if (!workflow) {
      return jsonError('Workflow not found', 404, 'NOT_FOUND');
    }

    const body = await readJsonBody<any>(request);
    const updated = await workflowService.updateWorkflow(params.id, body);

    return jsonOk(updated);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/v1/workflows/:id');
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

    const workflow = await workflowService.getWorkflow(params.id);

    if (!workflow) {
      return jsonError('Workflow not found', 404, 'NOT_FOUND');
    }

    await workflowService.deleteWorkflow(params.id);

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/v1/workflows/:id');
  }
}
