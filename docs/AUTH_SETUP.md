# Authentication Setup Guide

This project uses **NextAuth.js v4** with **Prisma** and **PostgreSQL** for authentication and session management.

## Features

- ✅ Email/password authentication with bcrypt
- ✅ OAuth integration (Google as example)
- ✅ JWT-based sessions
- ✅ Protected routes and server-side authentication helpers
- ✅ Database-backed user management
- ✅ Automatic session persistence

## Environment Variables

Copy `.env.example` to `.env.local` and configure the following:

### Required

```bash
# PostgreSQL Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_agents?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-here"
```

To generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### Optional (OAuth)

```bash
# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Database Setup

### 1. Start PostgreSQL

Make sure PostgreSQL is running. You can use Docker:

```bash
docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

Or use a local installation.

### 2. Generate Prisma Client

```bash
pnpm db:generate
```

### 3. Run Migrations

Create and apply database migrations:

```bash
pnpm db:migrate
```

This will:
- Create all necessary tables (users, accounts, sessions, workflows, etc.)
- Apply any pending migrations
- Generate the Prisma Client

### 4. Seed Database (Optional)

Populate the database with demo data:

```bash
pnpm db:seed
```

Demo credentials:
- **Email**: `demo@example.com`
- **Password**: `password123`

## Database Schema

### Auth Tables

- **User**: Stores user accounts with email, password (hashed), name, and image
- **Account**: OAuth provider accounts linked to users
- **Session**: Active user sessions (using JWT strategy by default)
- **VerificationToken**: Email verification tokens

### Application Tables

- **Workflow**: User-created workflows
- **WorkflowVersion**: Versioned workflow definitions
- **Execution**: Workflow execution records
- **ExecutionLog**: Detailed execution logs
- **Subscription**: User subscription/billing information

## API Routes

### NextAuth API

- `POST /api/auth/[nextauth]` - Handles all NextAuth operations (signin, signout, callback, etc.)

### Registration

- `POST /api/auth/register` - Create new user account
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe" // optional
  }
  ```

## Pages

- `/auth/signin` - Sign in page (email/password + OAuth)
- `/auth/signup` - Registration page
- `/auth/signout` - Sign out page
- `/auth/error` - Authentication error handling

## Protected Routes

All routes under `/dashboard/*` are protected and require authentication.

The `(protected)` route group layout automatically:
- Checks for valid session
- Redirects unauthenticated users to `/auth/signin`
- Displays user information

## Server-Side Authentication

### Get Current Session

```typescript
import { getSession } from '@/lib/auth-helpers';

export default async function Page() {
  const session = await getSession();
  
  if (!session) {
    // User is not authenticated
  }
  
  return <div>Hello {session.user.email}</div>;
}
```

### Require Authentication

```typescript
import { requireAuth } from '@/lib/auth-helpers';

export default async function ProtectedPage() {
  // Automatically redirects if not authenticated
  const session = await requireAuth();
  
  return <div>Welcome {session.user.name}</div>;
}
```

### Get Current User

```typescript
import { getCurrentUser } from '@/lib/auth-helpers';

export default async function Page() {
  const user = await getCurrentUser();
  
  if (!user) {
    // User is not authenticated
  }
}
```

## Client-Side Authentication

### Using useSession Hook

```typescript
'use client';

import { useSession } from 'next-auth/react';

export default function Component() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  
  if (!session) {
    return <div>Not authenticated</div>;
  }
  
  return <div>Hello {session.user.email}</div>;
}
```

### Sign In

```typescript
'use client';

import { signIn } from 'next-auth/react';

// Credentials
await signIn('credentials', {
  email: 'user@example.com',
  password: 'password123',
  callbackUrl: '/dashboard',
});

// OAuth
await signIn('google', { callbackUrl: '/dashboard' });
```

### Sign Out

```typescript
'use client';

import { signOut } from 'next-auth/react';

await signOut({ callbackUrl: '/' });
```

## OAuth Setup (Google)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Add authorized redirect URI:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

## Adding More OAuth Providers

Edit `/lib/auth.ts` and add more providers:

```typescript
import GitHubProvider from 'next-auth/providers/github';

providers: [
  // ... existing providers
  GitHubProvider({
    clientId: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
  }),
],
```

## Prisma Commands

```bash
# Generate Prisma Client
pnpm db:generate

# Create and apply migrations
pnpm db:migrate

# Push schema without migration (development only)
pnpm db:push

# Seed database
pnpm db:seed

# Open Prisma Studio (database GUI)
pnpm db:studio
```

## Troubleshooting

### Migration Issues

If migrations fail, you can reset the database:

```bash
# Warning: This will delete all data
pnpm prisma migrate reset
```

### Session Issues

If sessions aren't persisting:
1. Check that `NEXTAUTH_SECRET` is set
2. Clear browser cookies
3. Verify database connection
4. Check that SessionProvider is wrapping your app

### OAuth Issues

If OAuth isn't working:
1. Verify callback URLs match in provider settings
2. Check that environment variables are set correctly
3. Ensure `NEXTAUTH_URL` matches your domain
4. Check provider-specific documentation for setup

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. Use strong, unique `NEXTAUTH_SECRET` in production
3. Always use HTTPS in production
4. Implement rate limiting on auth endpoints
5. Use strong password requirements
6. Enable email verification for production
7. Implement 2FA for sensitive operations
8. Regularly rotate OAuth secrets
9. Monitor for suspicious authentication attempts
10. Keep dependencies updated

## Production Deployment

1. Set all environment variables in your hosting platform
2. Use a production PostgreSQL database (not local)
3. Set `NEXTAUTH_URL` to your production domain
4. Generate a new `NEXTAUTH_SECRET` for production
5. Enable HTTPS/SSL
6. Run migrations: `pnpm db:migrate`
7. Consider using database connection pooling (e.g., PgBouncer)

## Further Reading

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
