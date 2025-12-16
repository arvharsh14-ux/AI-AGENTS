# AI-AGENTS

Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma + NextAuth.js scaffold.

## Features

- 🔐 **Authentication** - NextAuth.js with email/password + OAuth
- 🗄️ **Database** - PostgreSQL with Prisma ORM
- 🎨 **Styling** - Tailwind CSS with UI components
- 🔒 **Protected Routes** - Server-side authentication guards
- 📊 **Type Safety** - Full TypeScript support
- 🌱 **Seeding** - Demo data for development

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`

### 3. Set up database

```bash
# Generate Prisma Client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed with demo data (optional)
pnpm db:seed
```

### 4. Start development server

```bash
pnpm dev
```

## Application Routes

- **Landing page**: http://localhost:3000
- **Sign In**: http://localhost:3000/auth/signin
- **Sign Up**: http://localhost:3000/auth/signup
- **Dashboard** (protected): http://localhost:3000/dashboard

## Demo Credentials

After seeding:
- **Email**: `demo@example.com`
- **Password**: `password123`

## Documentation

- [Authentication Setup Guide](./docs/AUTH_SETUP.md) - Complete authentication documentation

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript checks
pnpm format       # Format code with Prettier
pnpm db:generate  # Generate Prisma Client
pnpm db:migrate   # Run database migrations
pnpm db:seed      # Seed database with demo data
pnpm db:studio    # Open Prisma Studio
```
