import Link from 'next/link';

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
        <div className="text-sm font-medium">Protected area</div>
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
        </nav>
      </div>

      {children}
    </div>
  );
}
