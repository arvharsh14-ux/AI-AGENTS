'use client';

import { useEffect, useState } from 'react';

interface APIKey {
  id: string;
  key: string;
  name: string | null;
  role: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  usageCount: number;
}

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    role: 'viewer',
    expiresAt: '',
  });
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    setLoading(true);
    try {
      const res = await fetch('/api/workspaces/default/apikeys');
      if (res.ok) {
        setApiKeys(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newKeyData.name) return;

    try {
      const res = await fetch('/api/workspaces/default/apikeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKeyData),
      });

      if (res.ok) {
        const key = await res.json();
        setCreatedKey(key.key);
        setNewKeyData({ name: '', role: 'viewer', expiresAt: '' });
        loadKeys();
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  }

  async function handleDelete(keyId: string) {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const res = await fetch(`/api/workspaces/default/apikeys?keyId=${keyId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadKeys();
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">API Keys</h1>
          <p className="mt-2 text-slate-600">Manage API keys for programmatic access</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Create API Key
        </button>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Key</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Usage</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                  Last Used
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key) => (
                <tr key={key.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">{key.name || 'Unnamed'}</td>
                  <td className="px-4 py-3 font-mono text-sm">{key.key}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-600">
                      {key.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{key.usageCount}</td>
                  <td className="px-4 py-3 text-sm">
                    {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleDelete(key.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {apiKeys.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No API keys found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Create API Key</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={newKeyData.name}
                  onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  placeholder="Production API Key"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Role</label>
                <select
                  value={newKeyData.role}
                  onChange={(e) => setNewKeyData({ ...newKeyData, role: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Expires At (optional)
                </label>
                <input
                  type="datetime-local"
                  value={newKeyData.expiresAt}
                  onChange={(e) => setNewKeyData({ ...newKeyData, expiresAt: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreatedKey(null);
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>

            {createdKey && (
              <div className="mt-4 rounded-md bg-yellow-50 p-4">
                <p className="mb-2 text-sm font-medium text-yellow-800">
                  Save this key now! You won&apos;t be able to see it again.
                </p>
                <code className="block rounded bg-yellow-100 p-2 text-sm">{createdKey}</code>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
