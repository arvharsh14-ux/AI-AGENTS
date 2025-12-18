import { NextRequest, NextResponse } from 'next/server';
import { webhookService } from '@/lib/services/webhook.service';
import { verifyApiKey } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webhooks = await webhookService.findByWorkspace(auth.workspaceId);
    return NextResponse.json(webhooks);
  } catch (error: any) {
    console.error('Error fetching webhooks:', error);
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
    const { name, description, url, events, headers, retryPolicy } = body;

    if (!name || !url || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, url, events' },
        { status: 400 }
      );
    }

    const webhook = await webhookService.create({
      workspaceId: auth.workspaceId,
      name,
      description,
      url,
      events,
      headers,
      retryPolicy,
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error: any) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
