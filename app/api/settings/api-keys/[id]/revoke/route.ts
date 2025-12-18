import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userService } from '@/lib/services/user.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = await userService.revokeApiKey(session.user.id, params.id);

    return NextResponse.json({ apiKey });
  } catch (error: any) {
    if (error?.message === 'API key not found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    console.error('Failed to revoke API key:', error);
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
  }
}
