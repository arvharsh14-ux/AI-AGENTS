'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/workflows', label: 'Workflows' },
  { href: '/settings', label: 'Settings' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/monitoring', label: 'Monitoring' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/team', label: 'Team' },
  { href: '/api-keys', label: 'API Keys' },
  { href: '/billing', label: 'Billing' },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ProtectedShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null };
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = useMemo(
    () => user.name || user.email || 'Account',
    [user.email, user.name],
  );

  const Sidebar = (
    <aside className="flex h-full w-72 flex-col border-r bg-white">
      <div className="flex h-16 items-center gap-3 px-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            AI
          </span>
          <span className="text-sm font-semibold text-slate-900">AI Agents</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 pb-4">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-100',
                )}
                onClick={() => setMobileOpen(false)}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t p-4">
        <div className="mb-3 text-xs font-medium text-slate-500">Signed in as</div>
        <div className="truncate text-sm font-medium text-slate-900">
          {displayName}
        </div>
        <Button asChild variant="outline" size="sm" className="mt-3 w-full">
          <Link href="/auth/signout">Sign out</Link>
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden md:block">{Sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-xl">{Sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b bg-white/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6h16" />
                  <path d="M4 12h16" />
                  <path d="M4 18h16" />
                </svg>
              </Button>
              <div>
                <div className="text-sm font-semibold text-slate-900">Workflow Builder</div>
                <div className="text-xs text-slate-500">Build and run automations</div>
              </div>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="outline" size="sm">
                <Link href="/">Home</Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
