'use client';

import { useEffect, useState } from 'react';

interface AlertRule {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  conditions: any;
  createdAt: string;
}

interface AlertChannel {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: any;
  createdAt: string;
}

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [channels, setChannels] = useState<AlertChannel[]>([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    type: 'execution_failure',
    threshold: 5,
    window: 60,
  });
  const [newChannel, setNewChannel] = useState({
    name: '',
    type: 'email',
    config: { emails: '', webhookUrl: '' },
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [rulesRes, channelsRes] = await Promise.all([
      fetch('/api/workspaces/default/alerts/rules'),
      fetch('/api/workspaces/default/alerts/channels'),
    ]);

    if (rulesRes.ok) setRules(await rulesRes.json());
    if (channelsRes.ok) setChannels(await channelsRes.json());
  }

  async function handleCreateRule() {
    try {
      const res = await fetch('/api/workspaces/default/alerts/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRule.name,
          type: newRule.type,
          conditions: {
            metric: 'failures',
            operator: 'gt',
            threshold: newRule.threshold,
            window: newRule.window,
          },
        }),
      });

      if (res.ok) {
        setShowRuleModal(false);
        setNewRule({ name: '', type: 'execution_failure', threshold: 5, window: 60 });
        loadData();
      }
    } catch (error) {
      console.error('Failed to create alert rule:', error);
    }
  }

  async function handleCreateChannel() {
    try {
      const config =
        newChannel.type === 'email'
          ? { emails: newChannel.config.emails.split(',').map((e: string) => e.trim()) }
          : { webhookUrl: newChannel.config.webhookUrl };

      const res = await fetch('/api/workspaces/default/alerts/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChannel.name,
          type: newChannel.type,
          config,
        }),
      });

      if (res.ok) {
        setShowChannelModal(false);
        setNewChannel({ name: '', type: 'email', config: { emails: '', webhookUrl: '' } });
        loadData();
      }
    } catch (error) {
      console.error('Failed to create alert channel:', error);
    }
  }

  async function handleToggleRule(ruleId: string, enabled: boolean) {
    try {
      const res = await fetch('/api/workspaces/default/alerts/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ruleId, enabled: !enabled }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Failed to toggle alert rule:', error);
    }
  }

  async function handleDeleteRule(ruleId: string) {
    if (!confirm('Are you sure you want to delete this alert rule?')) return;

    try {
      const res = await fetch(`/api/workspaces/default/alerts/rules?ruleId=${ruleId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Failed to delete alert rule:', error);
    }
  }

  async function handleDeleteChannel(channelId: string) {
    if (!confirm('Are you sure you want to delete this alert channel?')) return;

    try {
      const res = await fetch(`/api/workspaces/default/alerts/channels?channelId=${channelId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Failed to delete alert channel:', error);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Alerts</h1>
        <p className="mt-2 text-slate-600">Configure alert rules and notification channels</p>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Alert Rules</h2>
          <button
            onClick={() => setShowRuleModal(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Create Rule
          </button>
        </div>
        <div className="divide-y">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-4">
              <div className="flex-1">
                <h3 className="font-medium">{rule.name}</h3>
                <p className="text-sm text-slate-600">{formatRuleType(rule.type)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleRule(rule.id, rule.enabled)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    rule.enabled
                      ? 'bg-green-100 text-green-600'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {rule.enabled ? 'Enabled' : 'Disabled'}
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="rounded-md px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {rules.length === 0 && (
            <p className="p-8 text-center text-slate-500">No alert rules configured</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Notification Channels</h2>
          <button
            onClick={() => setShowChannelModal(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Add Channel
          </button>
        </div>
        <div className="divide-y">
          {channels.map((channel) => (
            <div key={channel.id} className="flex items-center justify-between p-4">
              <div className="flex-1">
                <h3 className="font-medium">{channel.name}</h3>
                <p className="text-sm text-slate-600 capitalize">{channel.type}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    channel.enabled
                      ? 'bg-green-100 text-green-600'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {channel.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  onClick={() => handleDeleteChannel(channel.id)}
                  className="rounded-md px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {channels.length === 0 && (
            <p className="p-8 text-center text-slate-500">No notification channels configured</p>
          )}
        </div>
      </div>

      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Create Alert Rule</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  placeholder="High failure rate"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Type</label>
                <select
                  value={newRule.type}
                  onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                >
                  <option value="execution_failure">Execution Failure</option>
                  <option value="rate_limit_breach">Rate Limit Breach</option>
                  <option value="quota_warning">Quota Warning</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Threshold</label>
                <input
                  type="number"
                  value={newRule.threshold}
                  onChange={(e) => setNewRule({ ...newRule, threshold: parseInt(e.target.value) })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Window (minutes)</label>
                <input
                  type="number"
                  value={newRule.window}
                  onChange={(e) => setNewRule({ ...newRule, window: parseInt(e.target.value) })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={handleCreateRule}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Create
              </button>
              <button
                onClick={() => setShowRuleModal(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Add Notification Channel</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  placeholder="Team Email"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Type</label>
                <select
                  value={newChannel.type}
                  onChange={(e) => setNewChannel({ ...newChannel, type: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                >
                  <option value="email">Email</option>
                  <option value="slack">Slack Webhook</option>
                </select>
              </div>
              {newChannel.type === 'email' ? (
                <div>
                  <label className="mb-1 block text-sm font-medium">Emails (comma-separated)</label>
                  <input
                    type="text"
                    value={newChannel.config.emails}
                    onChange={(e) =>
                      setNewChannel({
                        ...newChannel,
                        config: { ...newChannel.config, emails: e.target.value },
                      })
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2"
                    placeholder="team@example.com, alerts@example.com"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium">Slack Webhook URL</label>
                  <input
                    type="text"
                    value={newChannel.config.webhookUrl}
                    onChange={(e) =>
                      setNewChannel({
                        ...newChannel,
                        config: { ...newChannel.config, webhookUrl: e.target.value },
                      })
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2"
                    placeholder="https://hooks.slack.com/..."
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={handleCreateChannel}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={() => setShowChannelModal(false)}
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

function formatRuleType(type: string): string {
  const typeMap: Record<string, string> = {
    execution_failure: 'Execution Failure Alert',
    rate_limit_breach: 'Rate Limit Breach Alert',
    quota_warning: 'Quota Warning Alert',
  };
  return typeMap[type] || type;
}
