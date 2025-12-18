import { NextRequest } from 'next/server';
import { apiKeyService } from '@/lib/services/api-key.service';

export interface AuthContext {
  apiKeyId: string;
  workspaceId: string;
  userId: string;
  permissions: Record<string, any>;
}

export async function verifyApiKey(request: NextRequest): Promise<AuthContext | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const apiKey = authHeader.substring(7);
  
  try {
    const key = await apiKeyService.verify(apiKey);
    
    if (!key) {
      return null;
    }

    return {
      apiKeyId: key.id,
      workspaceId: key.workspaceId,
      userId: key.createdBy,
      permissions: key.permissions as Record<string, any>,
    };
  } catch (error) {
    console.error('Error verifying API key:', error);
    return null;
  }
}

export function hasPermission(auth: AuthContext, permission: string): boolean {
  if (auth.permissions.admin === true) {
    return true;
  }

  return auth.permissions[permission] === true;
}
