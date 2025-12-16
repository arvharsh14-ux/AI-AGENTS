import type { Metadata } from 'next';
import Link from 'next/link';
import { Inter } from 'next/font/google';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Agents',
  description: 'Next.js 14 SaaS starter scaffold',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen">
        <header className="border-b">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-sm font-semibold">
              AI Agents
            </Link>
            <nav className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-10">{children}</main>

        <footer className="border-t">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 text-xs text-slate-500">
            Starter scaffold • Next.js 14 • Tailwind CSS
          </div>
        </footer>
      </body>
    </html>
  );
}
