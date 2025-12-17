import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { requirePermission } from '@/lib/services/rbac.service';
import { createBillingPortalSession } from '@/lib/services/stripe.service';

export async function POST(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await requireAuth();
  const { workspaceId } = params;

  await requirePermission(session.user.id, workspaceId, 'billing:read');

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const returnUrl = `${baseUrl}/billing`;

  try {
    const portalSession = await createBillingPortalSession(workspaceId, returnUrl);

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
