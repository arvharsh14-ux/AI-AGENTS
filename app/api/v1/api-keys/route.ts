import { NextRequest, NextResponse } from 'next/server';
import { apiKeyService } from '@/lib/services/api-key.service';
import { verifyApiKey } from '@/lib/middleware/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId parameter' }, { status: 400 });
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

    return NextResponse.json(sanitized);
  } catch (error: any) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, name, role, expiresAt } = body;

    if (!workspaceId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: workspaceId, name' },
        { status: 400 }
      );
    }

    const apiKey = await apiKeyService.create({
      workspaceId,
      name,
      role: role || 'viewer',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: session.user.id,
    });

    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.plainKey,
      role: apiKey.role,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      warning: 'Save this API key now. You will not be able to see it again.',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
