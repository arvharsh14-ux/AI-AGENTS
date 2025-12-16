'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StepDefinition, StepType } from '@/lib/types/workflow.types';
import { CanvasNode } from './canvas-node';
import { Button } from '@/components/ui/button';

interface WorkflowCanvasProps {
  steps: StepDefinition[];
  onStepsChange: (steps: StepDefinition[]) => void;
  selectedStepId: string | null;
  onSelectStep: (id: string | null) => void;
}

export function WorkflowCanvas({
  steps,
  onStepsChange,
  selectedStepId,
  onSelectStep,
}: WorkflowCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Handle Drag Over (from Library)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle Drop (from Library)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/reactflow') as StepType;
    
    if (type && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newStep: StepDefinition = {
        id: `step-${Date.now()}`,
        name: `New ${type}`,
        type,
        config: {},
        position: steps.length,
        layout: { x, y },
      };

      onStepsChange([...steps, newStep]);
      onSelectStep(newStep.id);
    }
  };

  // Handle Node Dragging
  const handleNodeDragStart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const step = steps.find((s) => s.id === id);
    if (step && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const nodeX = step.layout?.x || 0;
      const nodeY = step.layout?.y || 0;
      
      setDragOffset({
        x: e.clientX - rect.left - nodeX,
        y: e.clientY - rect.top - nodeY,
      });
      setDraggedNodeId(id);
      setIsDragging(true);
      onSelectStep(id);
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && draggedNodeId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;

      const updatedSteps = steps.map((s) => {
        if (s.id === draggedNodeId) {
          return { ...s, layout: { x, y } };
        }
        return s;
      });
      
      onStepsChange(updatedSteps);
    }
  }, [isDragging, draggedNodeId, dragOffset, steps, onStepsChange]);

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNodeId(null);
  };

  // Click on background deselects
  const handleBackgroundClick = () => {
    onSelectStep(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 bg-slate-100 overflow-hidden h-[600px] border rounded-md"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleBackgroundClick}
      style={{
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      <svg className="absolute inset-0 pointer-events-none w-full h-full">
        {/* Draw lines between steps based on array order for now */}
        {steps.map((step, index) => {
          if (index < steps.length - 1) {
            const nextStep = steps[index + 1];
            const startX = (step.layout?.x || 0) + 96; // Center of width (w-48 = 192px / 2 = 96)
            const startY = (step.layout?.y || 0) + 80; // Approximate bottom
            const endX = (nextStep.layout?.x || 0) + 96;
            const endY = (nextStep.layout?.y || 0); // Top

            return (
              <path
                key={`${step.id}-${nextStep.id}`}
                d={`M ${startX} ${startY} C ${startX} ${startY + 50} ${endX} ${endY - 50} ${endX} ${endY}`}
                stroke="#94a3b8"
                strokeWidth="2"
                fill="none"
              />
            );
          }
          return null;
        })}
      </svg>

      {steps.map((step) => (
        <CanvasNode
          key={step.id}
          id={step.id}
          name={step.name}
          type={step.type}
          x={step.layout?.x || 0}
          y={step.layout?.y || 0}
          isSelected={selectedStepId === step.id}
          onSelect={onSelectStep}
          onDragStart={handleNodeDragStart}
        />
      ))}
      
      {steps.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-slate-400">Drag steps here from the library</p>
        </div>
      )}
    </div>
  );
}
