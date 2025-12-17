import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/services/audit.service';

export async function GET(req: NextRequest) {
  const session = await requireAuth();

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      billingPlan: true,
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      _count: {
        select: {
          apiKeys: true,
        },
      },
    },
  });

  return NextResponse.json(workspaces);
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  const body = await req.json();

  const { name, slug } = body;

  if (!name || !slug) {
    return NextResponse.json(
      { error: 'Name and slug are required' },
      { status: 400 }
    );
  }

  // Get free plan
  const freePlan = await prisma.billingPlan.findFirst({
    where: { name: 'Free' },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      billingPlanId: freePlan?.id,
      members: {
        create: {
          userId: session.user.id,
          role: 'owner',
        },
      },
    },
  });

  await logAuditEvent(
    workspace.id,
    'workspace.created',
    'workspace',
    workspace.id,
    session.user.id
  );

  return NextResponse.json(workspace);
}
