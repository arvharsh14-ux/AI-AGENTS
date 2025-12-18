import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userService } from '@/lib/services/user.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await userService.getUser(session.user.id);

    return NextResponse.json({ workspacePreferences: user?.workspacePreferences || null });
  } catch (error: any) {
    console.error('Failed to load workspace preferences:', error);
    return NextResponse.json(
      { error: 'Failed to load workspace preferences' },
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

    const updated = await userService.updateWorkspacePreferences(
      session.user.id,
      body?.workspacePreferences ?? null
    );

    return NextResponse.json({ workspacePreferences: updated.workspacePreferences });
  } catch (error: any) {
    console.error('Failed to update workspace preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update workspace preferences' },
      { status: 500 }
    );
  }
}
