'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export type WorkflowConnector = {
  id: string;
  name: string;
  connectorType: string;
  config: {
    baseUrl: string;
    auth: any;
  };
};

export function ConnectorsManager({
  workflowId,
  maxConnectors,
  onConnectorsChange,
}: {
  workflowId: string;
  maxConnectors: number;
  onConnectorsChange: (connectors: WorkflowConnector[]) => void;
}) {
  const [connectors, setConnectors] = useState<WorkflowConnector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [authType, setAuthType] = useState<'none' | 'api_key' | 'bearer_token' | 'basic'>('none');
  const [headerName, setHeaderName] = useState('X-API-Key');
  const [apiKey, setApiKey] = useState('');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const load = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/workflows/${workflowId}/connectors`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load connectors');
      }

      const data = await res.json();
      setConnectors(data.connectors || []);
      onConnectorsChange(data.connectors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  const createConnector = async () => {
    setError(null);

    try {
      const res = await fetch(`/api/workflows/${workflowId}/connectors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          connectorType: 'http',
          config: {
            baseUrl,
            authType,
            headerName,
            apiKey,
            token,
            username,
            password,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create connector');
      }

      await load();
      setCreateOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const deleteConnector = async (id: string) => {
    setError(null);

    try {
      const res = await fetch(`/api/workflows/${workflowId}/connectors/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete connector');
      }

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const canCreate = connectors.length < maxConnectors;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Connectors store API base URLs and auth.
        </p>

        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (open) {
              setName('');
              setBaseUrl('');
              setAuthType('none');
              setHeaderName('X-API-Key');
              setApiKey('');
              setToken('');
              setUsername('');
              setPassword('');
            }
          }}
        >
          <DialogTrigger asChild>
            <Button disabled={!canCreate}>Add Connector</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add HTTP connector</DialogTitle>
              <DialogDescription>
                Store an API base URL and auth once, then reference it from HTTP steps.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="connectorName">Name</Label>
                <Input
                  id="connectorName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Stripe API"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="authType">Auth</Label>
                <Select
                  id="authType"
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value as any)}
                >
                  <option value="none">None</option>
                  <option value="api_key">API Key (header)</option>
                  <option value="bearer_token">Bearer token</option>
                  <option value="basic">Basic auth</option>
                </Select>
              </div>

              {authType === 'api_key' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="headerName">Header name</Label>
                    <Input
                      id="headerName"
                      value={headerName}
                      onChange={(e) => setHeaderName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API key</Label>
                    <Input
                      id="apiKey"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                </>
              )}

              {authType === 'bearer_token' && (
                <div className="space-y-2">
                  <Label htmlFor="token">Token</Label>
                  <Input
                    id="token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>
              )}

              {authType === 'basic' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                disabled={!name || !baseUrl}
                onClick={createConnector}
              >
                Create
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!canCreate && (
        <p className="text-sm text-slate-600">
          Connector limit reached for your plan.
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading...</p>
      ) : connectors.length === 0 ? (
        <p className="text-sm text-slate-600">No connectors yet.</p>
      ) : (
        <div className="space-y-3">
          {connectors.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border bg-white p-4"
            >
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-slate-600">
                  {c.config.baseUrl} · {c.config.auth?.type}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteConnector(c.id)}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
