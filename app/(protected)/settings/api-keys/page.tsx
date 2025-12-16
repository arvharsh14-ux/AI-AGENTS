import Link from 'next/link';
import { requireAuth } from '@/lib/auth-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiKeysManager } from '@/components/settings/api-keys-manager';

export default async function ApiKeysPage() {
  await requireAuth();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/settings" className="text-sm text-slate-600 underline">
          Back to settings
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">API Keys</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <ApiKeysManager />
        </CardContent>
      </Card>
    </div>
  );
}
