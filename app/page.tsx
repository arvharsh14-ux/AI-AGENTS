import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Next.js 14 SaaS scaffold
        </h1>
        <p className="max-w-2xl text-slate-600">
          Tailwind CSS, TypeScript, ESLint/Prettier, module aliases, and a small
          set of UI primitives.
        </p>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button variant="secondary" asChild>
            <a
              href="https://nextjs.org/docs/app"
              target="_blank"
              rel="noreferrer noopener"
            >
              App Router docs
            </a>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Routing</CardTitle>
            <CardDescription>App Router + route groups</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Includes a placeholder landing page and a protected layout shell at{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5">/dashboard</code>.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Styling</CardTitle>
            <CardDescription>Tailwind CSS is wired up</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            UI primitives use consistent tokens and a shared{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5">cn()</code> helper.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
            <CardDescription>.env.example included</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Scaffolded variables for Postgres, Redis, NextAuth, Socket.io, and
            Stripe.
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
