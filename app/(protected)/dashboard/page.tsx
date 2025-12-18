import { requireAuth } from '@/lib/auth-helpers';
import { workflowService } from '@/lib/services/workflow.service';
import { billingService } from '@/lib/services/billing.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await requireAuth();
  const workflows = await workflowService.listWorkflows(session.user.id);
  const plan = await billingService.getPlanForUser(session.user.id);

  const activeWorkflows = workflows.filter((w) => w.versions.some((v) => v.isActive)).length;
  const totalWorkflows = workflows.length;
  const canCreateWorkflow =
    plan.tier === 'pro' || totalWorkflows < plan.limits.maxWorkflows;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        {canCreateWorkflow ? (
          <Button asChild>
            <Link href="/workflows/create">Create Workflow</Link>
          </Button>
        ) : (
          <Button asChild variant="secondary">
            <Link href="/settings/billing">Upgrade to create more</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-600">
                {plan.tier === 'pro' ? 'Pro' : 'Free'}
                {plan.subscription?.status ? ` · ${plan.subscription.status}` : ''}
              </p>
              <p className="text-sm text-slate-600">
                Workflows: {totalWorkflows}/{String(plan.limits.maxWorkflows)}
              </p>
            </div>
            {plan.tier === 'free' && (
              <Button asChild size="sm">
                <Link href="/settings/billing">Upgrade</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkflows}</div>
            <p className="text-xs text-slate-600">Workflows created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkflows}</div>
            <p className="text-xs text-slate-600">Currently published</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkflows - activeWorkflows}</div>
            <p className="text-xs text-slate-600">Unpublished versions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.length > 0
                ? new Date(workflows[0]!.updatedAt).toLocaleDateString()
                : 'N/A'}
            </div>
            <p className="text-xs text-slate-600">Most recent change</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <p className="text-sm text-slate-600">No workflows yet. Create one to get started.</p>
          ) : (
            <div className="space-y-4">
              {workflows.slice(0, 5).map((workflow) => (
                <div
                  key={workflow.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <p className="font-medium">{workflow.name}</p>
                    <p className="text-sm text-slate-600">{workflow.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      workflow.versions.some((v) => v.isActive)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {workflow.versions.some((v) => v.isActive) ? 'Active' : 'Draft'}
                    </span>
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/workflows/${workflow.id}`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
