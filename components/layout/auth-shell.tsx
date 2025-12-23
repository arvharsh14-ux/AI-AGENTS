'use client';

import Link from 'next/link';

import { cn } from '@/lib/utils';

export function AuthShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-200 blur-3xl" />
        <div className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-sky-200 blur-3xl" />
      </div>

      <div className={cn('relative w-full max-w-md', className)}>{children}</div>

      <Link
        href="/"
        className="absolute left-4 top-4 rounded-md px-3 py-2 text-xs font-medium text-slate-600 hover:bg-white/60 hover:text-slate-900"
      >
        ← Back to home
      </Link>
    </div>
  );
}
