'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

type WorkspacePreferences = {
  timezone?: string;
  defaultWorkflowPublic?: boolean;
};

export function WorkspacePreferencesForm() {
  const [preferences, setPreferences] = useState<WorkspacePreferences>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/settings/workspace');
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load preferences');
        }

        const data = await res.json();
        setPreferences(data.workspacePreferences || {});
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const save = async () => {
    setIsSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch('/api/settings/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspacePreferences: preferences }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save preferences');
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Input
          id="timezone"
          value={preferences.timezone || ''}
          onChange={(e) =>
            setPreferences((p) => ({ ...p, timezone: e.target.value }))
          }
          placeholder="e.g. America/Los_Angeles"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="defaultWorkflowPublic"
          checked={Boolean(preferences.defaultWorkflowPublic)}
          onChange={(e) =>
            setPreferences((p) => ({
              ...p,
              defaultWorkflowPublic: (e.target as HTMLInputElement).checked,
            }))
          }
        />
        <Label htmlFor="defaultWorkflowPublic" className="mb-0 font-normal">
          Default new workflows to public
        </Label>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {saved && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          Preferences saved.
        </div>
      )}

      <Button onClick={save} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}
