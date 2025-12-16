'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StepType } from '@/lib/types/workflow.types';

const STEP_TYPES: { type: StepType; label: string; description: string }[] = [
  { type: 'http_request', label: 'HTTP Request', description: 'Make an API call' },
  { type: 'transform', label: 'Transform', description: 'Transform data with JS' },
  { type: 'conditional', label: 'Conditional', description: 'If/Else logic' },
  { type: 'loop', label: 'Loop', description: 'Iterate over a list' },
  { type: 'delay', label: 'Delay', description: 'Wait for a duration' },
  { type: 'custom_code', label: 'Custom Code', description: 'Run custom JS/Python' },
];

export function StepLibrary() {
  const onDragStart = (event: React.DragEvent, type: StepType) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card className="h-full border-r rounded-none border-l-0 border-t-0 border-b-0 w-64 flex flex-col">
      <CardHeader className="py-4">
        <CardTitle className="text-lg">Steps Library</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-3 p-4">
        {STEP_TYPES.map((item) => (
          <div
            key={item.type}
            className="p-3 border rounded-md cursor-grab hover:bg-slate-50 active:cursor-grabbing bg-white shadow-sm"
            draggable
            onDragStart={(e) => onDragStart(e, item.type)}
          >
            <div className="font-medium text-sm">{item.label}</div>
            <div className="text-xs text-slate-500 mt-1">{item.description}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
