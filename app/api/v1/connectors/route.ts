import { NextRequest, NextResponse } from 'next/server';
import { connectorService } from '@/lib/services/connector.service';
import { connectorRegistry } from '@/lib/connectors';
import { verifyApiKey } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const showAvailable = searchParams.get('available') === 'true';

    if (showAvailable) {
      const available = Object.values(connectorRegistry).map((connector) => ({
        type: connector.type,
        name: connector.name,
        description: connector.description,
        actions: connector.actions,
      }));
      
      return NextResponse.json(available);
    }

    const connectors = await connectorService.findByWorkspace(auth.workspaceId);
    return NextResponse.json(connectors);
  } catch (error: any) {
    console.error('Error fetching connectors:', error);
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
    const { name, type, description, config, credentialId } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type' },
        { status: 400 }
      );
    }

    const connector = await connectorService.create({
      workspaceId: auth.workspaceId,
      name,
      type,
      description,
      config: config || {},
      credentialId,
    });

    return NextResponse.json(connector, { status: 201 });
  } catch (error: any) {
    console.error('Error creating connector:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
