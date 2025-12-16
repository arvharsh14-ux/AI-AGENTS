# AI-AGENTS

Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma + NextAuth.js + Bull/Redis SaaS scaffold.

## Features

- 🔐 **Authentication** - NextAuth.js with email/password + OAuth
- 🗄️ **Database** - PostgreSQL with Prisma ORM
- ⚡ **Queues** - Bull + Redis for background jobs
- 🎨 **Styling** - Tailwind CSS with UI components
- 🔒 **Protected Routes** - Server-side authentication guards
- 📊 **Type Safety** - Full TypeScript support
- 🏢 **Multi-tenancy** - Workspace-based architecture
- 🌱 **Seeding** - Demo data for development

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL`, `REDIS_URL` and `NEXTAUTH_SECRET`.

### 3. Start Infrastructure

Use Docker Compose to start PostgreSQL, Redis, and Maildev:

```bash
docker compose up -d
```

### 4. Set up database

```bash
# Generate Prisma Client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed with demo data (optional)
pnpm db:seed
```

### 5. Start development server

You need to start both the Next.js app and the background workers:

```bash
# Terminal 1: Next.js App
pnpm dev

# Terminal 2: Background Workers
pnpm workers
```

## Infrastructure

- **PostgreSQL**: Primary database (port 5432)
- **Redis**: Queue backend (port 6379)
- **Maildev**: Local email testing (port 1080 for UI, 1025 for SMTP)

## Application Routes

- **Landing page**: http://localhost:3000
- **Sign In**: http://localhost:3000/auth/signin
- **Dashboard** (protected): http://localhost:3000/dashboard
- **Workflows**: http://localhost:3000/workflows

## Demo Credentials

After seeding:
- **Email**: `demo@example.com`
- **Password**: `password123`

## CI/CD

Run the following scripts to verify the codebase:

```bash
pnpm ci           # Run lint, typecheck, test, and build
pnpm test         # Run unit tests
pnpm lint         # Run linter
```
