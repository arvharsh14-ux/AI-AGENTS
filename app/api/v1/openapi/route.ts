import { handleApiError, jsonOk } from '@/lib/api/route-helpers';
import { openApiSpec } from '@/lib/openapi/spec';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return jsonOk(openApiSpec);
  } catch (error) {
    return handleApiError(error, 'GET /api/v1/openapi');
  }
}
