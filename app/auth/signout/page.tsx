'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignOutPage() {
  useEffect(() => {
    const performSignOut = async () => {
      await signOut({ callbackUrl: '/', redirect: true });
    };
    performSignOut();
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Signing out...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Please wait while we sign you out.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
