import { NextRequest } from 'next/server';

import {
  ApiError,
  handleApiError,
  jsonError,
  jsonOk,
  readJsonBody,
} from '@/lib/api/route-helpers';
import { verifyApiKey } from '@/lib/middleware/auth';
import { executionService } from '@/lib/services/execution.service';

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

    const execution = await executionService.getExecution(params.id);

    if (!execution) {
      return jsonError('Execution not found', 404, 'NOT_FOUND');
    }

    return jsonOk(execution);
  } catch (error) {
    return handleApiError(error, 'GET /api/v1/executions/:id');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return jsonError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const execution = await executionService.getExecution(params.id);

    if (!execution) {
      return jsonError('Execution not found', 404, 'NOT_FOUND');
    }

    const body = await readJsonBody<any>(request);
    const action = body?.action;

    if (action === 'cancel') {
      if (execution.status !== 'pending' && execution.status !== 'running') {
        throw new ApiError(
          'Execution cannot be cancelled in its current state',
          400,
          'VALIDATION_ERROR',
        );
      }

      await executionService.updateExecution(params.id, {
        status: 'cancelled',
        completedAt: new Date(),
        error: 'Cancelled by user',
      });

      return jsonOk({ success: true, status: 'cancelled' });
    }

    throw new ApiError('Invalid action', 400, 'VALIDATION_ERROR');
  } catch (error) {
    return handleApiError(error, 'POST /api/v1/executions/:id');
  }
}
