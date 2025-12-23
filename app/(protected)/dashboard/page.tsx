import Link from 'next/link';

import { requireAuth } from '@/lib/auth-helpers';
import { billingService } from '@/lib/services/billing.service';
import { workflowService } from '@/lib/services/workflow.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function StatCard({
  label,
  value,
  helper,
  tone = 'slate',
}: {
  label: string;
  value: React.ReactNode;
  helper: string;
  tone?: 'slate' | 'indigo' | 'emerald' | 'amber';
}) {
  const toneClasses: Record<typeof tone, string> = {
    slate: 'bg-slate-50 text-slate-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-700">
          {label}
        </CardTitle>
        <span
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-lg',
            toneClasses[tone],
          )}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M12 4h9" />
            <path d="M4 9h16" />
            <path d="M4 15h16" />
          </svg>
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight text-slate-900">
          {value}
        </div>
        <p className="mt-1 text-xs text-slate-600">{helper}</p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const session = await requireAuth();
  const workflows = await workflowService.listWorkflows(session.user.id);
  const plan = await billingService.getPlanForUser(session.user.id);

  const activeWorkflows = workflows.filter((w: any) =>
    w.versions.some((v: any) => v.isActive),
  ).length;
  const totalWorkflows = workflows.length;
  const canCreateWorkflow =
    plan.tier === 'pro' || totalWorkflows < plan.limits.maxWorkflows;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitor your workflows, drafts, and plan usage.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {canCreateWorkflow ? (
            <Button asChild>
              <Link href="/workflows/create">Create workflow</Link>
            </Button>
          ) : (
            <Button asChild variant="secondary">
              <Link href="/settings/billing">Upgrade to create more</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total workflows"
          value={totalWorkflows}
          helper="Workflows created"
          tone="indigo"
        />
        <StatCard
          label="Active"
          value={activeWorkflows}
          helper="Currently published"
          tone="emerald"
        />
        <StatCard
          label="Drafts"
          value={totalWorkflows - activeWorkflows}
          helper="Unpublished versions"
          tone="amber"
        />
        <StatCard
          label="Last updated"
          value={
            workflows.length > 0
              ? new Date(workflows[0]!.updatedAt).toLocaleDateString()
              : '—'
          }
          helper="Most recent change"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {plan.tier === 'pro' ? 'Pro' : 'Free'} plan
                  </div>
                  <div className="text-xs text-slate-600">
                    {plan.subscription?.status
                      ? `Status: ${plan.subscription.status}`
                      : 'No active subscription'}
                  </div>
                </div>
                {plan.tier === 'free' && (
                  <Button asChild size="sm">
                    <Link href="/settings/billing">Upgrade</Link>
                  </Button>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-medium text-slate-700">
                  Workflow limit
                </div>
                <div className="mt-1 text-sm text-slate-900">
                  {totalWorkflows}/{String(plan.limits.maxWorkflows)} workflows
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent workflows</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/workflows">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {workflows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-sm font-medium text-slate-900">
                  No workflows yet
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Create one to get started with automation.
                </p>
                <div className="mt-5">
                  <Button asChild>
                    <Link href="/workflows/create">Create workflow</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="divide-y rounded-lg border border-slate-200">
                {workflows.slice(0, 5).map((workflow: any) => {
                  const isActive = workflow.versions.some((v: any) => v.isActive);
                  return (
                    <div
                      key={workflow.id}
                      className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/workflows/${workflow.id}`}
                            className="truncate font-medium text-slate-900 hover:underline"
                          >
                            {workflow.name}
                          </Link>
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                              isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700',
                            )}
                          >
                            {isActive ? 'Active' : 'Draft'}
                          </span>
                        </div>
                        {workflow.description && (
                          <p className="mt-1 line-clamp-1 text-sm text-slate-600">
                            {workflow.description}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-slate-500">
                          Updated {new Date(workflow.updatedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button asChild variant="secondary" size="sm">
                          <Link href={`/workflows/${workflow.id}`}>Edit</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
