import { ExecutionMonitor } from '@/components/workflows/execution-monitor';

export default function MonitoringPage() {
  const { data: session } = useSession();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    workflowId: '',
  });
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadMetrics, 5000); // Update metrics every 5 seconds
    return () => clearInterval(interval);
  }, [filters]);

  async function loadData() {
    setLoading(true);
    try {
      await Promise.all([loadExecutions(), loadMetrics()]);
    } finally {
      setLoading(false);
    }
  }

  async function loadExecutions() {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.workflowId) params.append('workflowId', filters.workflowId);
    params.append('take', '50');

    const res = await fetch(`/api/executions?${params}`);
    if (res.ok) {
      const data = await res.json();
      setExecutions(data.executions);
    }
  }

  async function loadMetrics() {
    const res = await fetch('/api/metrics?realtime=true');
    if (res.ok) {
      setMetrics(await res.json());
    }
  }

  async function handleExport(format: 'csv' | 'json') {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.workflowId) params.append('workflowId', filters.workflowId);
    params.append('format', format);

    const res = await fetch(`/api/executions?${params}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `executions.${format}`;
      a.click();
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'running':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Monitoring</h1>
        <p className="text-slate-600">Track execution history and performance in real-time.</p>
      </div>
      <ExecutionMonitor />
    </div>
  );
}

function ExecutionDetailsModal({
  execution,
  onClose,
}: {
  execution: Execution;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[80vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Execution Details</h2>
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="mb-2 font-semibold">Workflow</h3>
            <p className="text-slate-600">{execution.workflowVersion.workflow.name}</p>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Steps</h3>
            <div className="space-y-2">
              {execution.steps.map((step, idx) => (
                <div key={step.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{step.step.name}</span>
                      <span className="ml-2 text-sm text-slate-600">({step.step.type})</span>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs ${statusColor(step.status)}`}>
                      {step.status}
                    </span>
                  </div>
                  {step.durationMs && (
                    <p className="mt-1 text-sm text-slate-600">Duration: {step.durationMs}ms</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Logs</h3>
            <div className="max-h-64 overflow-y-auto rounded-md bg-slate-900 p-4 font-mono text-sm text-white">
              {execution.logs.map((log, idx) => (
                <div key={idx} className="mb-1">
                  <span className={logLevelColor(log.level)}>[{log.level.toUpperCase()}]</span>{' '}
                  <span className="text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>{' '}
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'text-green-600 bg-green-50';
    case 'failed':
      return 'text-red-600 bg-red-50';
    case 'running':
      return 'text-blue-600 bg-blue-50';
    default:
      return 'text-slate-600 bg-slate-50';
  }
}

function logLevelColor(level: string) {
  switch (level) {
    case 'error':
      return 'text-red-400';
    case 'warn':
      return 'text-yellow-400';
    case 'info':
      return 'text-blue-400';
    default:
      return 'text-slate-400';
  }
}
