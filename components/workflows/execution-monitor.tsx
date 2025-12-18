'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/components/providers/socket-provider';
import { ExecutionStatus } from './execution-status';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Execution {
  id: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
  workflowVersion: {
    workflow: {
      id: string;
      name: string;
    };
  };
  trigger?: {
    id: string;
    type: string;
  };
}

interface ExecutionMonitorProps {
  workflowId?: string;
  autoRefresh?: boolean;
}

export function ExecutionMonitor({ workflowId, autoRefresh = true }: ExecutionMonitorProps) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket, isConnected } = useSocket();

  const fetchExecutions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (workflowId) {
        params.append('workflowId', workflowId);
      }
      params.append('limit', '20');

      const response = await fetch(`/api/executions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch executions');
      }

      const data = await response.json();
      setExecutions(data.executions);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  useEffect(() => {
    if (!socket || !autoRefresh) return;

    const handleExecutionEvent = (data: any) => {
      console.log('[Execution Event]', data);
      fetchExecutions();
    };

    socket.on('started', handleExecutionEvent);
    socket.on('completed', handleExecutionEvent);
    socket.on('failed', handleExecutionEvent);

    return () => {
      socket.off('started', handleExecutionEvent);
      socket.off('completed', handleExecutionEvent);
      socket.off('failed', handleExecutionEvent);
    };
  }, [socket, autoRefresh, fetchExecutions]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-600">Error: {error}</p>
      </Card>
    );
  }

  if (executions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-slate-500">No executions found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Executions</h2>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <div
            className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-600">
                Workflow
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-600">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-600">
                Started
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-600">
                Duration
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-600">
                Trigger
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {executions.map((execution) => (
              <tr
                key={execution.id}
                className="hover:bg-slate-50"
              >
                <td className="px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium text-slate-900">
                      {execution.workflowVersion.workflow.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {execution.id.slice(0, 8)}...
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <ExecutionStatus status={execution.status} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {formatDate(execution.startedAt)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {formatDuration(execution.durationMs)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {execution.trigger?.type || 'manual'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
