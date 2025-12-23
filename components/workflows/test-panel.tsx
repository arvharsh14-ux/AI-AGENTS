'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

interface TestPanelProps {
  workflowId: string;
  onRunTest: (input: any) => Promise<string | null>; // Returns jobId
}

interface LogEntry {
  timestamp: string;
  type: 'info' | 'error' | 'success';
  message: string;
  details?: any;
}

export function TestPanel({ onRunTest }: TestPanelProps) {
  const [input, setInput] = useState('{
  "test": true
}');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io({
      path: '/api/socket',
      autoConnect: false,
    });

    socketRef.current = socket;

    socket.on('step_started', (data) => {
      addLog('info', `Step started: ${data.stepName}`, data);
    });

    socket.on('step_completed', (data) => {
      addLog('success', `Step completed: ${data.stepName}`, data.output);
    });

    socket.on('step_failed', (data) => {
      addLog('error', `Step failed: ${data.stepName}`, data.error);
    });

    socket.on('completed', (data) => {
      addLog('success', 'Workflow completed successfully', data.output);
      setIsRunning(false);
    });

    socket.on('failed', (data) => {
      addLog('error', 'Workflow failed', data.error);
      setIsRunning(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (executionId && socketRef.current) {
      if (!socketRef.current.connected) {
        socketRef.current.connect();
      }
      socketRef.current.emit('subscribe', executionId);
    }
  }, [executionId]);

  const addLog = (type: LogEntry['type'], message: string, details?: any) => {
    setLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        details,
      },
    ]);
  };

  const handleRun = async () => {
    try {
      setLogs([]);
      setIsRunning(true);

      const inputJson = JSON.parse(input);

      const id = await onRunTest(inputJson);
      if (id) {
        setExecutionId(id);
        addLog('info', `Execution started: ${id}`);
      } else {
        setIsRunning(false);
      }
    } catch {
      addLog('error', 'Invalid JSON input');
      setIsRunning(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-white p-4">
        <h3 className="text-base font-semibold text-slate-900">Test workflow</h3>
        <p className="mt-1 text-xs text-slate-500">
          Run the workflow with custom JSON and inspect execution logs.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900">Input JSON</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="h-32 font-mono text-xs"
          />
        </div>

        <Button onClick={handleRun} disabled={isRunning}>
          {isRunning && <Spinner className="h-4 w-4" />}
          Run test
        </Button>

        <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
            Execution logs
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {logs.length === 0 ? (
              <div className="mt-4 text-center text-xs text-slate-400">
                Run the workflow to see logs.
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 font-mono text-[10px] text-slate-400">
                        {log.timestamp}
                      </span>
                      <span
                        className={
                          log.type === 'error'
                            ? 'font-semibold text-red-600'
                            : log.type === 'success'
                              ? 'font-semibold text-emerald-600'
                              : 'text-slate-700'
                        }
                      >
                        {log.message}
                      </span>
                    </div>
                    {log.details && (
                      <pre className="mt-2 overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-2 font-mono text-[10px] text-slate-600">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
