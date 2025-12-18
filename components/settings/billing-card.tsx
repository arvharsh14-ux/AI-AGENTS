'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function BillingCard({
  tier,
  status,
  currentPeriodEnd,
}: {
  tier: 'free' | 'pro';
  status: string | null;
  currentPeriodEnd: string | null;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upgrade = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start checkout');
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Missing checkout URL');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-600">Current plan</p>
        <p className="text-xl font-semibold text-slate-900">
          {tier === 'pro' ? 'Pro' : 'Free'}
        </p>
        {status && (
          <p className="text-sm text-slate-600">Subscription status: {status}</p>
        )}
        {currentPeriodEnd && (
          <p className="text-sm text-slate-600">
            Current period ends: {new Date(currentPeriodEnd).toLocaleDateString()}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {tier === 'free' ? (
        <Button onClick={upgrade} disabled={isLoading}>
          {isLoading ? 'Redirecting...' : 'Upgrade to Pro'}
        </Button>
      ) : (
        <p className="text-sm text-slate-600">
          You are on Pro. Manage billing in Stripe.
        </p>
      )}
    </div>
  );
}
