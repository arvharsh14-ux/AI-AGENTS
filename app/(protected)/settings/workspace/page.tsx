import Link from 'next/link';
import { requireAuth } from '@/lib/auth-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkspacePreferencesForm } from '@/components/settings/workspace-preferences-form';

export default async function WorkspaceSettingsPage() {
  await requireAuth();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/settings" className="text-sm text-slate-600 underline">
          Back to settings
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Workspace Preferences
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Defaults</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkspacePreferencesForm />
        </CardContent>
      </Card>
    </div>
  );
}
