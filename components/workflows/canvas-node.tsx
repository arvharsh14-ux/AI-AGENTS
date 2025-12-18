'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { StepType } from '@/lib/types/workflow.types';
import { cn } from '@/lib/utils';

interface CanvasNodeProps {
  id: string;
  name: string;
  type: StepType;
  x: number;
  y: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
}

export function CanvasNode({
  id,
  name,
  type,
  x,
  y,
  isSelected,
  onSelect,
  onDragStart,
}: CanvasNodeProps) {
  return (
    <Card
      className={cn(
        "absolute w-48 shadow-md cursor-pointer select-none transition-shadow",
        isSelected ? "ring-2 ring-blue-500 border-blue-500" : "border-slate-200 hover:border-slate-300"
      )}
      style={{
        left: x,
        top: y,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      onMouseDown={(e) => onDragStart(id, e)}
    >
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            getStepColor(type)
          )} />
          <span className="text-xs font-semibold uppercase text-slate-500">
            {type.replace('_', ' ')}
          </span>
        </div>
        <div className="font-medium text-sm truncate" title={name || '(Unnamed)'}>
          {name || '(Unnamed step)'}
        </div>
        
        {/* Connection Handles (Visual Only for now) */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-300 rounded-full border border-white" />
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-300 rounded-full border border-white" />
      </div>
    </Card>
  );
}

function getStepColor(type: StepType): string {
  switch (type) {
    case 'http_request': return 'bg-blue-500';
    case 'transform': return 'bg-purple-500';
    case 'conditional': return 'bg-orange-500';
    case 'loop': return 'bg-green-500';
    case 'delay': return 'bg-yellow-500';
    case 'custom_code': return 'bg-pink-500';
    default: return 'bg-slate-500';
  }
}
