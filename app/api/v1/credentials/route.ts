import { NextRequest, NextResponse } from 'next/server';
import { credentialService } from '@/lib/services/credential.service';
import { verifyApiKey } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    return NextResponse.json(sanitized);
  } catch (error: any) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, provider, data, metadata, rotationPolicy, expiresAt } = body;

    if (!name || !type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, data' },
        { status: 400 }
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

    return NextResponse.json({
      id: credential.id,
      name: credential.name,
      description: credential.description,
      type: credential.type,
      provider: credential.provider,
      metadata: credential.metadata,
      createdAt: credential.createdAt,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating credential:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
