import { requireAuth } from '@/lib/auth-helpers';
import { workflowService } from '@/lib/services/workflow.service';
import { billingService } from '@/lib/services/billing.service';
import { notFound } from 'next/navigation';
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

  const activeVersion = workflow.versions.find((v) => v.isActive);
  const latestVersion = workflow.versions[workflow.versions.length - 1];
  const workingVersion = latestVersion || activeVersion;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{workflow.name}</h1>
          {workflow.description && (
            <p className="mt-2 text-slate-600">{workflow.description}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">
            {activeVersion ? 'Active' : 'Draft'}
          </p>
          <p className="text-xs text-slate-600">
            {activeVersion ? `Published on ${new Date(activeVersion.publishedAt!).toLocaleDateString()}` : 'Not published'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Builder</CardTitle>
        </CardHeader>
        <CardContent>
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
            <p className="text-slate-600">No workflow version found. Create steps to get started.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <ExecutionMonitor workflowId={workflow.id} />
        </CardContent>
      </Card>
    </div>
  );
}
