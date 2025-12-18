import Link from 'next/link';
import { requireAuth } from '@/lib/auth-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function SettingsPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-slate-600">Manage your account and workspace.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-600">
              Update your display name.
            </p>
            <Link
              href="/settings/profile"
              className="text-sm font-medium text-slate-900 underline"
            >
              Open Profile
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-600">
              Manage your subscription and plan.
            </p>
            <Link
              href="/settings/billing"
              className="text-sm font-medium text-slate-900 underline"
            >
              Open Billing
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-600">
              Create and revoke API keys.
            </p>
            <Link
              href="/settings/api-keys"
              className="text-sm font-medium text-slate-900 underline"
            >
              Open API Keys
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-600">
              Customize defaults for your workspace.
            </p>
            <Link
              href="/settings/workspace"
              className="text-sm font-medium text-slate-900 underline"
            >
              Open Workspace
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
