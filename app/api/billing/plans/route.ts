import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const plans = await prisma.billingPlan.findMany({
    orderBy: { price: 'asc' },
  });

  return NextResponse.json(plans);
}
