import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dispatchQueue } from '@/lib/workflow/queue';

export async function GET() {
  try {
    // Check Database
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis (via Bull)
    await dispatchQueue.getJobCounts();

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: 'connected',
          redis: 'connected',
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 503 }
    );
  }
}
