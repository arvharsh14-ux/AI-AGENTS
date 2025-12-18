'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type ApiKey = {
  id: string;
  name: string;
  last4: string;
  createdAt: string;
  revokedAt: string | null;
};

export function ApiKeysManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/settings/api-keys');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load API keys');
      }
      const data = await res.json();
      setApiKeys(data.apiKeys || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createKey = async () => {
    setError(null);
    setCreatedToken(null);

    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create API key');
      }

      const data = await res.json();
      setCreatedToken(data.token);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const revokeKey = async (id: string) => {
    setError(null);

    try {
      const res = await fetch(`/api/settings/api-keys/${id}/revoke`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to revoke API key');
      }

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">
            API keys can be used for programmatic access.
          </p>
        </div>

        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (open) {
              setNewKeyName('');
              setCreatedToken(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>Create API Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API key</DialogTitle>
              <DialogDescription>
                This token will only be shown once.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="keyName">Name</Label>
              <Input
                id="keyName"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Local dev"
              />
            </div>

            {createdToken && (
              <div className="space-y-2">
                <Label>Token</Label>
                <Input value={createdToken} readOnly />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                onClick={createKey}
                disabled={!newKeyName || Boolean(createdToken)}
              >
                {createdToken ? 'Created' : 'Create'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCreateOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading...</p>
      ) : apiKeys.length === 0 ? (
        <p className="text-sm text-slate-600">No API keys created yet.</p>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between rounded-lg border bg-white p-4"
            >
              <div>
                <p className="font-medium">{key.name}</p>
                <p className="text-sm text-slate-600">
                  ••••{key.last4} · created{' '}
                  {new Date(key.createdAt).toLocaleDateString()}
                  {key.revokedAt ? ' · revoked' : ''}
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                disabled={Boolean(key.revokedAt)}
                onClick={() => revokeKey(key.id)}
              >
                {key.revokedAt ? 'Revoked' : 'Revoke'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
