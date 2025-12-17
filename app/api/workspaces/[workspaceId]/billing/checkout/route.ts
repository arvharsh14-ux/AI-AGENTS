import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { requirePermission } from '@/lib/services/rbac.service';
import { createCheckoutSession } from '@/lib/services/stripe.service';

export async function POST(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await requireAuth();
  const { workspaceId } = params;
  const body = await req.json();

  await requirePermission(session.user.id, workspaceId, 'billing:write');

  const { priceId } = body;

  if (!priceId) {
    return NextResponse.json(
      { error: 'priceId is required' },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const successUrl = `${baseUrl}/billing?success=true`;
  const cancelUrl = `${baseUrl}/billing?canceled=true`;

  try {
    const checkoutSession = await createCheckoutSession(
      workspaceId,
      priceId,
      successUrl,
      cancelUrl
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
