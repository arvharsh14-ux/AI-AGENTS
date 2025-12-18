import Link from 'next/link';
import { requireAuth } from '@/lib/auth-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from '@/components/settings/profile-form';

export default async function ProfileSettingsPage() {
  const session = await requireAuth();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/settings" className="text-sm text-slate-600 underline">
          Back to settings
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initialName={session.user.name || ''}
            email={session.user.email || ''}
          />
        </CardContent>
      </Card>
    </div>
  );
}
