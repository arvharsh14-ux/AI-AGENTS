'use client';

import { useEffect, useState } from 'react';

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  userId: string | null;
  metadata: any;
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [membersRes, logsRes] = await Promise.all([
        fetch('/api/workspaces/default/members'),
        fetch('/api/workspaces/default/audit-logs?take=20'),
      ]);

      if (membersRes.ok) setMembers(await membersRes.json());
      if (logsRes.ok) {
        const data = await logsRes.json();
        setAuditLogs(data.logs);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail) return;

    try {
      const res = await fetch('/api/workspaces/default/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (res.ok) {
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('viewer');
        alert('Invite sent successfully!');
      }
    } catch (error) {
      console.error('Failed to invite member:', error);
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const res = await fetch(`/api/workspaces/default/members?userId=${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      const res = await fetch('/api/workspaces/default/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Team Management</h1>
          <p className="mt-2 text-slate-600">Manage team members and permissions</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Invite Member
        </button>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Team Members</h2>
        </div>
        <div className="divide-y">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  {member.user.name?.[0] || member.user.email[0]}
                </div>
                <div>
                  <p className="font-medium">{member.user.name || member.user.email}</p>
                  <p className="text-sm text-slate-600">{member.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.user.id, e.target.value)}
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  onClick={() => handleRemove(member.user.id)}
                  className="rounded-md px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Activity Feed</h2>
        </div>
        <div className="divide-y">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                📝
              </div>
              <div className="flex-1">
                <p className="text-sm">{formatAction(log.action)}</p>
                <p className="text-xs text-slate-600">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Invite Team Member</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={handleInvite}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Send Invite
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    'workspace.created': 'Workspace created',
    'member.invited': 'Member invited',
    'member.removed': 'Member removed',
    'member.role_updated': 'Member role updated',
    'apikey.created': 'API key created',
    'apikey.deleted': 'API key deleted',
    'workflow.created': 'Workflow created',
    'workflow.updated': 'Workflow updated',
    'workflow.deleted': 'Workflow deleted',
  };

  return actionMap[action] || action;
}
