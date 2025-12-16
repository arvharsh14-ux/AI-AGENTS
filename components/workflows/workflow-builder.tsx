'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { StepEditor } from './step-editor';
import type { Workflow, WorkflowVersion } from '@prisma/client';
import type { WorkflowDefinition } from '@/lib/types/workflow.types';

interface WorkflowBuilderProps {
  workflow: Workflow;
  version: WorkflowVersion;
}

interface Step {
  id: string;
  name: string;
  type: 'http_request' | 'transform' | 'conditional' | 'loop' | 'delay' | 'error_handler' | 'fallback' | 'custom_code';
  config: Record<string, any>;
  position: number;
}

export function WorkflowBuilder({ workflow, version }: WorkflowBuilderProps) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [showStepEditor, setShowStepEditor] = useState(false);

  useEffect(() => {
    const definition = version.definition as unknown as WorkflowDefinition;
    if (definition.steps) {
      setSteps(definition.steps as unknown as Step[]);
    }
  }, [version]);

  const handleAddStep = useCallback(() => {
    const newStep: Step = {
      id: `step-${Date.now()}`,
      name: '',
      type: 'http_request',
      config: {},
      position: steps.length,
    };
    setEditingStep(newStep);
    setShowStepEditor(true);
  }, [steps]);

  const handleEditStep = useCallback((step: Step) => {
    setEditingStep(step);
    setShowStepEditor(true);
  }, []);

  const handleSaveStep = useCallback((updatedStep: Step) => {
    if (editingStep?.id === updatedStep.id) {
      setSteps(steps.map((s) => (s.id === updatedStep.id ? updatedStep : s)));
    } else {
      setSteps([...steps, updatedStep]);
    }
    setEditingStep(null);
    setShowStepEditor(false);
  }, [steps, editingStep]);

  const handleDeleteStep = useCallback((id: string) => {
    setSteps(steps.filter((s) => s.id !== id));
  }, [steps]);

  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const definition: WorkflowDefinition = {
        steps,
      };

      const response = await fetch(`/api/workflows/${workflow.id}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ definition }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save workflow');
      }

      // Optionally publish the version
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const definition: WorkflowDefinition = {
        steps,
      };

      const response = await fetch(`/api/workflows/${workflow.id}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ definition, publish: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to publish workflow');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-slate-50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Workflow Steps</h3>

        {steps.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-white p-8 text-center">
            <p className="mb-4 text-slate-600">No steps yet. Add your first step to get started.</p>
            <Button onClick={handleAddStep}>Add Step</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-center justify-between rounded-lg border bg-white p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{step.name || '(Unnamed step)'}</p>
                    <p className="text-sm text-slate-600">{step.type}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditStep(step)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteStep(step.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}

            <Button
              variant="secondary"
              onClick={handleAddStep}
              className="w-full"
            >
              Add Step
            </Button>
          </div>
        )}
      </div>

      {showStepEditor && editingStep && (
        <StepEditor
          step={editingStep}
          onSave={handleSaveStep}
          onCancel={() => {
            setShowStepEditor(false);
            setEditingStep(null);
          }}
        />
      )}

      <div className="flex gap-4">
        <Button
          disabled={isSaving || steps.length === 0}
          onClick={handleSaveWorkflow}
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </Button>
        <Button
          variant="secondary"
          disabled={isSaving || steps.length === 0}
          onClick={handlePublish}
        >
          {isSaving ? 'Publishing...' : 'Publish'}
        </Button>
      </div>
    </div>
  );
}
