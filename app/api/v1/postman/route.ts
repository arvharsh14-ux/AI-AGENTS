import { handleApiError, jsonOk } from '@/lib/api/route-helpers';
import { postmanCollection } from '@/lib/openapi/postman-collection';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return jsonOk(postmanCollection);
  } catch (error) {
    return handleApiError(error, 'GET /api/v1/postman');
  }
}
