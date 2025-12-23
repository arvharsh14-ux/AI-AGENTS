import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { AuthProvider } from '@/components/providers/session-provider';
import { RootShell } from '@/components/layout/root-shell';
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
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>
          <RootShell>{children}</RootShell>
        </AuthProvider>
      </body>
    </html>
  );
}
