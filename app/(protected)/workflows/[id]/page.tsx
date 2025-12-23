import { notFound } from 'next/navigation';

import { requireAuth } from '@/lib/auth-helpers';
import { billingService } from '@/lib/services/billing.service';
import { workflowService } from '@/lib/services/workflow.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkflowBuilder } from '@/components/workflows/workflow-builder';
import { ExecutionMonitor } from '@/components/workflows/execution-monitor';

export default async function WorkflowDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireAuth();
  const workflow = await workflowService.getWorkflow(params.id);

  if (!workflow) {
    notFound();
  }

  if (workflow.userId !== session.user.id) {
    notFound();
  }

  const plan = await billingService.getPlanForUser(session.user.id);

  const activeVersion = workflow.versions.find((v: any) => v.isActive);
  const latestVersion = workflow.versions[workflow.versions.length - 1];
  const workingVersion = latestVersion || activeVersion;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-semibold tracking-tight text-slate-900">
            {workflow.name}
          </h1>
          {workflow.description && (
            <p className="mt-2 text-sm text-slate-600">{workflow.description}</p>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-right">
          <p className="text-sm font-medium text-slate-900">
            {activeVersion ? 'Active' : 'Draft'}
          </p>
          <p className="text-xs text-slate-600">
            {activeVersion
              ? `Published on ${new Date(activeVersion.publishedAt!).toLocaleDateString()}`
              : 'Not published'}
          </p>
        </div>
      </div>

      {workingVersion ? (
        <WorkflowBuilder
          workflow={workflow}
          version={workingVersion}
          plan={{
            tier: plan.tier,
            limits: plan.limits,
          }}
        />
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-600">
            No workflow version found. Create steps to get started.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent executions</CardTitle>
        </CardHeader>
        <CardContent>
          <ExecutionMonitor workflowId={workflow.id} />
        </CardContent>
      </Card>
    </div>
  );
}
