import crypto from 'crypto';

export async function stripeRequest<T = any>(
  path: string,
  params: Record<string, any>,
  method: 'POST' | 'GET' = 'POST'
): Promise<T> {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }

  const url = new URL(`https://api.stripe.com/v1/${path}`);

  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    body.append(key, String(value));
  }

  let finalUrl = url;
  let fetchInit: RequestInit;

  if (method === 'GET') {
    body.forEach((v, k) => finalUrl.searchParams.append(k, v));
    fetchInit = {
      method,
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    };
  } else {
    fetchInit = {
      method,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    };
  }

  const res = await fetch(finalUrl.toString(), fetchInit);
  const json = (await res.json()) as any;

  if (!res.ok) {
    const message = json?.error?.message || 'Stripe API error';
    throw new Error(message);
  }

  return json as T;
}

export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): void {
  if (!signatureHeader) {
    throw new Error('Missing stripe-signature header');
  }

  const parts = signatureHeader.split(',');
  const timestampPart = parts.find((p) => p.startsWith('t='));
  const v1Parts = parts.filter((p) => p.startsWith('v1='));

  if (!timestampPart || v1Parts.length === 0) {
    throw new Error('Invalid stripe-signature header');
  }

  const timestamp = timestampPart.split('=')[1];
  const signedPayload = `${timestamp}.${rawBody}`;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  const match = v1Parts.some((p) => {
    const sig = p.split('=')[1];
    if (!sig) return false;
    return timingSafeEqualHex(sig, expected);
  });

  if (!match) {
    throw new Error('Invalid Stripe webhook signature');
  }
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'hex');
  const bBuf = Buffer.from(b, 'hex');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}
