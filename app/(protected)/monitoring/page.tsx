import { ExecutionMonitor } from '@/components/workflows/execution-monitor';

export default function MonitoringPage() {
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
