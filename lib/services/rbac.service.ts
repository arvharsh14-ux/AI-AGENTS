import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export type Role = 'owner' | 'admin' | 'editor' | 'viewer';

const roleHierarchy: Record<Role, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

export const permissions = {
  'workspace:read': ['owner', 'admin', 'editor', 'viewer'],
  'workspace:write': ['owner', 'admin'],
  'workflow:create': ['owner', 'admin', 'editor'],
  'workflow:read': ['owner', 'admin', 'editor', 'viewer'],
  'workflow:update': ['owner', 'admin', 'editor'],
  'workflow:delete': ['owner', 'admin'],
  'workflow:execute': ['owner', 'admin', 'editor'],
  'member:invite': ['owner', 'admin'],
  'member:remove': ['owner', 'admin'],
  'member:read': ['owner', 'admin', 'editor', 'viewer'],
  'apikey:create': ['owner', 'admin'],
  'apikey:read': ['owner', 'admin', 'editor', 'viewer'],
  'apikey:delete': ['owner', 'admin'],
  'billing:read': ['owner', 'admin'],
  'billing:write': ['owner'],
  'alerts:read': ['owner', 'admin', 'editor', 'viewer'],
  'alerts:write': ['owner', 'admin'],
};

export async function getUserWorkspaceRole(
  userId: string,
  workspaceId: string
): Promise<Role | null> {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  return membership?.role as Role | null;
}

export async function hasPermission(
  userId: string,
  workspaceId: string,
  permission: keyof typeof permissions
): Promise<boolean> {
  const role = await getUserWorkspaceRole(userId, workspaceId);
  if (!role) return false;

  const allowedRoles = permissions[permission];
  return allowedRoles.includes(role);
}

export async function requirePermission(
  userId: string,
  workspaceId: string,
  permission: keyof typeof permissions
): Promise<void> {
  const allowed = await hasPermission(userId, workspaceId, permission);
  if (!allowed) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

export async function inviteMember(
  workspaceId: string,
  email: string,
  role: Role,
  invitedById: string
) {
  // Check if inviter has permission
  await requirePermission(invitedById, workspaceId, 'member:invite');

  // Generate unique token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

  const invite = await prisma.workspaceInvite.create({
    data: {
      email,
      workspaceId,
      role,
      token,
      invitedById,
      expiresAt,
    },
  });

  return invite;
}

export async function acceptInvite(token: string, userId: string) {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
  });

  if (!invite) {
    throw new Error('Invite not found');
  }

  if (invite.status !== 'pending') {
    throw new Error('Invite already used or expired');
  }

  if (invite.expiresAt < new Date()) {
    await prisma.workspaceInvite.update({
      where: { token },
      data: { status: 'expired' },
    });
    throw new Error('Invite has expired');
  }

  // Create membership
  await prisma.workspaceMember.create({
    data: {
      userId,
      workspaceId: invite.workspaceId,
      role: invite.role,
    },
  });

  // Mark invite as accepted
  await prisma.workspaceInvite.update({
    where: { token },
    data: { status: 'accepted' },
  });

  return invite.workspaceId;
}

export async function removeMember(
  workspaceId: string,
  userId: string,
  removedById: string
) {
  await requirePermission(removedById, workspaceId, 'member:remove');

  // Can't remove yourself if you're the only owner
  const ownerCount = await prisma.workspaceMember.count({
    where: {
      workspaceId,
      role: 'owner',
    },
  });

  const memberToRemove = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (memberToRemove?.role === 'owner' && ownerCount === 1) {
    throw new Error('Cannot remove the last owner');
  }

  await prisma.workspaceMember.delete({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });
}

export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  newRole: Role,
  updatedById: string
) {
  await requirePermission(updatedById, workspaceId, 'member:invite');

  await prisma.workspaceMember.update({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    data: { role: newRole },
  });
}
