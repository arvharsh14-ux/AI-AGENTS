import Link from 'next/link';
import { requireAuth } from '@/lib/auth-helpers';

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAuth();

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Workflow Builder</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {session.user.name || session.user.email}
            </span>
            <Link
              href="/auth/signout"
              className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-48 border-r bg-white px-4 py-6">
          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Dashboard
            </Link>
            <Link
              href="/workflows"
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Workflows
            </Link>
            <Link
              href="/settings"
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Settings
              href="/integrations"
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Integrations
            </Link>
            <Link
              href="/monitoring"
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Monitoring
            </Link>
            <Link
              href="/billing"
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Billing
            </Link>
            <Link
              href="/"
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Home
            </Link>
          </nav>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
