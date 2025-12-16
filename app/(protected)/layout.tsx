import Link from 'next/link';
import { requireAuth } from '@/lib/auth-helpers';

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
        <div className="text-sm font-medium">
          Welcome, {session.user.name || session.user.email}
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100"
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100"
          >
            Dashboard
          </Link>
          <Link
            href="/auth/signout"
            className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100"
          >
            Sign Out
          </Link>
        </nav>
      </div>

      {children}
    </div>
  );
}
