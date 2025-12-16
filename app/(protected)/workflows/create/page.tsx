import { requireAuth } from '@/lib/auth-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkflowForm } from '@/components/workflows/workflow-form';

export default async function CreateWorkflowPage() {
  await requireAuth();

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Create Workflow</h1>
        <p className="mt-2 text-slate-600">
          Create a new workflow to automate your tasks.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Details</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowForm />
        </CardContent>
      </Card>
    </div>
  );
}
