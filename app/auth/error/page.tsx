'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { AuthShell } from '@/components/layout/auth-shell';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      default:
        return 'An unexpected error occurred during authentication.';
    }
  };

  return (
    <AuthShell>
      <div className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Sign-in error
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Something went wrong while trying to authenticate.
        </p>

        <div className="mt-6">
          <Alert variant="destructive">{getErrorMessage(error)}</Alert>
        </div>

        <div className="mt-6 space-y-3">
          <Button asChild className="w-full">
            <Link href="/auth/signin">Back to sign in</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Go to home</Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading…</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
