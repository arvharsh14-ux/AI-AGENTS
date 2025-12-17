'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface BillingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  stripePriceId: string | null;
  maxExecutionsPerMonth: number;
  maxConnectors: number;
  maxRunMinutesPerMonth: number;
  maxWorkflows: number;
  maxTeamMembers: number;
}

interface Usage {
  executions: { current: number; limit: number; percentage: number };
  runMinutes: { current: number; limit: number; percentage: number };
  workflows: { current: number; limit: number; percentage: number };
  connectors: { current: number; limit: number; percentage: number };
  teamMembers: { current: number; limit: number; percentage: number };
}

export default function BillingPage() {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [plansRes, usageRes] = await Promise.all([
        fetch('/api/billing/plans'),
        fetch('/api/workspaces/default/usage'), // TODO: Use actual workspace ID
      ]);
      
      if (plansRes.ok) {
        setPlans(await plansRes.json());
      }
      
      if (usageRes.ok) {
        setUsage(await usageRes.json());
      }
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(priceId: string) {
    setUpgrading(true);
    try {
      const res = await fetch('/api/workspaces/default/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to start checkout:', error);
    } finally {
      setUpgrading(false);
    }
  }

  async function handleManageBilling() {
    try {
      const res = await fetch('/api/workspaces/default/billing/portal', {
        method: 'POST',
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Billing & Usage</h1>
        <p className="mt-2 text-slate-600">Manage your subscription and view usage statistics</p>
      </div>

      {usage && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Current Usage</h2>
          <div className="space-y-4">
            <UsageBar
              label="Workflow Executions"
              current={usage.executions.current}
              limit={usage.executions.limit}
              percentage={usage.executions.percentage}
            />
            <UsageBar
              label="Run Minutes"
              current={Math.round(usage.runMinutes.current)}
              limit={usage.runMinutes.limit}
              percentage={usage.runMinutes.percentage}
            />
            <UsageBar
              label="Workflows"
              current={usage.workflows.current}
              limit={usage.workflows.limit}
              percentage={usage.workflows.percentage}
            />
            <UsageBar
              label="Connectors"
              current={usage.connectors.current}
              limit={usage.connectors.limit}
              percentage={usage.connectors.percentage}
            />
            <UsageBar
              label="Team Members"
              current={usage.teamMembers.current}
              limit={usage.teamMembers.limit}
              percentage={usage.teamMembers.percentage}
            />
          </div>
          <button
            onClick={handleManageBilling}
            className="mt-4 rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Manage Billing
          </button>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-xl font-semibold">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">
                  ${(plan.price / 100).toFixed(0)}
                </span>
                <span className="text-slate-600">/month</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>✓ {plan.maxExecutionsPerMonth.toLocaleString()} executions/month</li>
                <li>✓ {plan.maxRunMinutesPerMonth} run minutes/month</li>
                <li>✓ {plan.maxWorkflows} workflows</li>
                <li>✓ {plan.maxConnectors} connectors</li>
                <li>✓ {plan.maxTeamMembers} team members</li>
              </ul>
              {plan.stripePriceId && (
                <button
                  onClick={() => handleUpgrade(plan.stripePriceId!)}
                  disabled={upgrading}
                  className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {upgrading ? 'Processing...' : 'Upgrade'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsageBar({
  label,
  current,
  limit,
  percentage,
}: {
  label: string;
  current: number;
  limit: number;
  percentage: number;
}) {
  const color =
    percentage > 90 ? 'bg-red-500' : percentage > 75 ? 'bg-yellow-500' : 'bg-blue-500';

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-slate-600">
          {current.toLocaleString()} / {limit === Infinity ? '∞' : limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
