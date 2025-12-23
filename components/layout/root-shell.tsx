'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/workflows',
  '/settings',
  '/integrations',
  '/monitoring',
  '/alerts',
  '/team',
  '/api-keys',
  '/billing',
];

function isProtectedRoute(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const protectedRoute = isProtectedRoute(pathname);
  const authRoute = pathname.startsWith('/auth');

  const showMarketingChrome = !protectedRoute && !authRoute;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {showMarketingChrome && (
        <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                AI
              </span>
              <span>AI Agents</span>
            </Link>
            <nav className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/signup">Get started</Link>
              </Button>
            </nav>
          </div>
        </header>
      )}

      <main
        className={cn(
          'flex-1',
          showMarketingChrome && 'mx-auto w-full max-w-6xl px-4 py-10',
        )}
      >
        {children}
      </main>

      {showMarketingChrome && (
        <footer className="border-t bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 text-xs text-slate-500">
            AI Agents • Next.js 14 • Tailwind CSS
          </div>
        </footer>
      )}
    </div>
  );
}
