import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { getMetricsForUser, getRealtimeMetrics } from '@/lib/services/metrics.service';

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  const { searchParams } = new URL(req.url);
  
  const realtime = searchParams.get('realtime') === 'true';
  
  if (realtime) {
    const metrics = await getRealtimeMetrics(session.user.id);
    return NextResponse.json(metrics);
  }

  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'startDate and endDate are required' },
      { status: 400 }
    );
  }

  const metrics = await getMetricsForUser(
    session.user.id,
    new Date(startDate),
    new Date(endDate)
  );

  return NextResponse.json(metrics);
}
