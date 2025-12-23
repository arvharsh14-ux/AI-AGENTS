import { requireAuth } from '@/lib/auth-helpers';
import { SocketProvider } from '@/components/providers/socket-provider';
import { ProtectedShell } from '@/components/layout/protected-shell';

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAuth();

  return (
    <SocketProvider>
      <ProtectedShell
        user={{
          name: session.user.name,
          email: session.user.email,
        }}
      >
        {children}
      </ProtectedShell>
    </SocketProvider>
  );
}
