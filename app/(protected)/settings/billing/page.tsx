import Link from 'next/link';
import { requireAuth } from '@/lib/auth-helpers';
import { billingService } from '@/lib/services/billing.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BillingCard } from '@/components/settings/billing-card';

export default async function BillingSettingsPage() {
  const session = await requireAuth();
  const plan = await billingService.getPlanForUser(session.user.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/settings" className="text-sm text-slate-600 underline">
          Back to settings
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Billing</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <BillingCard
            tier={plan.tier}
            status={plan.subscription?.status || null}
            currentPeriodEnd={
              plan.subscription?.currentPeriodEnd
                ? plan.subscription.currentPeriodEnd.toISOString()
                : null
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan limits</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Max workflows: {String(plan.limits.maxWorkflows)}</li>
            <li>Max steps per workflow: {String(plan.limits.maxStepsPerWorkflow)}</li>
            <li>
              Max connectors per workflow: {String(plan.limits.maxConnectorsPerWorkflow)}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
