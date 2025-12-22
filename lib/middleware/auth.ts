import { NextRequest } from 'next/server';
import { apiKeyService } from '@/lib/services/api-key.service';

export interface AuthContext {
  apiKeyId: string;
  workspaceId: string;
  role: string;
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
      role: key.role,
    };
  } catch (error) {
    console.error('Error verifying API key:', error);
    return null;
  }
}

export function hasPermission(auth: AuthContext, permission: string): boolean {
  // Admin role has all permissions
  if (auth.role === 'admin') {
    return true;
  }

  // Editor role can modify resources
  if (auth.role === 'editor' && !permission.includes('delete') && !permission.includes('admin')) {
    return true;
  }

  // Viewer role can only read
  if (auth.role === 'viewer' && permission.includes('read')) {
    return true;
  }

  return false;
}
