'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { io, Socket } from 'socket.io-client';
import { WorkflowDefinition } from '@/lib/types/workflow.types';

interface TestPanelProps {
  workflowId: string;
  onRunTest: (input: any) => Promise<string | null>; // Returns executionId
}

interface LogEntry {
  timestamp: string;
  type: 'info' | 'error' | 'success';
  message: string;
  details?: any;
}

export function TestPanel({ workflowId, onRunTest }: TestPanelProps) {
  const [input, setInput] = useState('{\n  "test": true\n}');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socket = io({
      path: '/api/socket',
      autoConnect: false,
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
    });

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
    } catch (e) {
      addLog('error', 'Invalid JSON input');
      setIsRunning(false);
    }
  };

  return (
    <Card className="h-full border-l rounded-none border-r-0 border-t-0 border-b-0 w-80 flex flex-col">
      <CardHeader className="py-4 border-b">
        <CardTitle className="text-lg">Test Workflow</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        <div className="space-y-2">
          <label className="text-sm font-medium">Input JSON</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="font-mono text-xs h-32"
          />
        </div>
        
        <Button onClick={handleRun} disabled={isRunning}>
          {isRunning ? 'Running...' : 'Run Test'}
        </Button>

        <div className="flex-1 border rounded-md overflow-hidden flex flex-col">
          <div className="bg-slate-100 px-3 py-2 text-xs font-semibold border-b">
            Execution Logs
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50">
            {logs.length === 0 && (
              <div className="text-xs text-slate-400 text-center mt-4">
                Run the workflow to see logs
              </div>
            )}
            {logs.map((log, i) => (
              <div key={i} className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono text-[10px]">
                    {log.timestamp}
                  </span>
                  <span className={
                    log.type === 'error' ? 'text-red-600 font-semibold' :
                    log.type === 'success' ? 'text-green-600 font-semibold' :
                    'text-slate-700'
                  }>
                    {log.message}
                  </span>
                </div>
                {log.details && (
                  <pre className="mt-1 ml-14 text-[10px] bg-white p-1 rounded border overflow-x-auto text-slate-500">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
