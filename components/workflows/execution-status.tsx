import { Badge } from '@/components/ui/badge';

interface ExecutionStatusProps {
  status: string;
}

export function ExecutionStatus({ status }: ExecutionStatusProps) {
  const statusConfig: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; label: string }> = {
    pending: { variant: 'default', label: 'Queued' },
    running: { variant: 'info', label: 'Running' },
    completed: { variant: 'success', label: 'Success' },
    failed: { variant: 'error', label: 'Failed' },
    cancelled: { variant: 'warning', label: 'Cancelled' },
  };

  const config = statusConfig[status] || { variant: 'default', label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
