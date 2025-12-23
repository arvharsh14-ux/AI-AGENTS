import { NextRequest } from 'next/server';

import { handleApiError, jsonError, jsonOk, readJsonBody } from '@/lib/api/route-helpers';
import { verifyApiKey } from '@/lib/middleware/auth';
import { executionService } from '@/lib/services/execution.service';
import { workflowService } from '@/lib/services/workflow.service';
import { dispatchQueue } from '@/lib/workflow/queue';

export const dynamic = 'force-dynamic';

export async function POST(
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

    const activeVersion = await workflowService.getActiveVersion(params.id);
    if (!activeVersion) {
      return jsonError('No active version found', 400, 'VALIDATION_ERROR');
    }

    const body = await readJsonBody<any>(request);
    const input = body?.input || {};

    const execution = await executionService.createExecution({
      workflowVersionId: activeVersion.id,
      input,
    });

    await dispatchQueue.add('execute-workflow', {
      executionId: execution.id,
    });

    return jsonOk(
      {
        executionId: execution.id,
        status: execution.status,
        startedAt: execution.startedAt,
      },
      { status: 202 },
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/v1/workflows/:id/execute');
  }
}
