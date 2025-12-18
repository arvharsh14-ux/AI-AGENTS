import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { billingService } from '@/lib/services/billing.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plan = await billingService.getPlanForUser(session.user.id);

    return NextResponse.json({ plan });
  } catch (error: any) {
    console.error('Failed to load subscription:', error);
    return NextResponse.json(
      { error: 'Failed to load subscription' },
      { status: 500 }
    );
  }
}
