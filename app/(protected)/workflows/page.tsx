import { requireAuth } from '@/lib/auth-helpers';
import { workflowService } from '@/lib/services/workflow.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { WorkflowsList } from '@/components/workflows/workflows-list';

export default async function WorkflowsPage() {
  const session = await requireAuth();
  const workflows = await workflowService.listWorkflows(session.user.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Workflows</h1>
        <Button asChild>
          <Link href="/workflows/create">Create Workflow</Link>
        </Button>
      </div>

      {workflows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <h3 className="mb-2 text-lg font-medium">No workflows yet</h3>
            <p className="mb-6 text-slate-600">
              Create your first workflow to get started with automation.
            </p>
            <Button asChild>
              <Link href="/workflows/create">Create Workflow</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <WorkflowsList workflows={workflows} />
      )}
    </div>
  );
}
