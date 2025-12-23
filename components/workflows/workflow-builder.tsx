'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type {
  StepDefinition,
  Workflow,
  WorkflowDefinition,
  WorkflowVersion,
} from '@/lib/types/workflow.types';

import { StepEditor } from './step-editor';
import { StepLibrary } from './step-library';
import { TestPanel } from './test-panel';
import { WorkflowCanvas } from './workflow-canvas';

interface WorkflowBuilderProps {
  workflow: Workflow;
  version: WorkflowVersion;
  plan: {
    tier: 'free' | 'pro';
    limits: {
      maxWorkflows: number;
      maxStepsPerWorkflow: number;
      maxConnectorsPerWorkflow: number;
    };
  };
}

type Notice = {
  type: 'success' | 'error' | 'info';
  message: string;
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function WorkflowBuilder({ workflow, version }: WorkflowBuilderProps) {
  const router = useRouter();

  const [steps, setSteps] = useState<StepDefinition[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'test'>('design');
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const definition = version.definition as unknown as WorkflowDefinition;
    if (definition.steps) {
      const stepsWithLayout = definition.steps.map((step, index) => ({
        ...step,
        layout: step.layout || { x: 120 + index * 60, y: 120 + index * 90 },
      }));
      setSteps(stepsWithLayout);
    } else {
      setSteps([]);
    }
  }, [version]);

  const selectedStepIndex = useMemo(
    () => steps.findIndex((s) => s.id === selectedStepId),
    [selectedStepId, steps],
  );
  const selectedStep = selectedStepIndex >= 0 ? steps[selectedStepIndex] : null;
  const previousSteps = selectedStepIndex >= 0 ? steps.slice(0, selectedStepIndex) : [];

  const handleSaveWorkflow = async (publish = false) => {
    setNotice(null);

    const normalizedSteps: StepDefinition[] = steps.map((s, index) => ({
      ...s,
      position: index,
      name: s.name?.trim() || '(Unnamed step)',
      layout: s.layout || { x: 120 + index * 60, y: 120 + index * 90 },
    }));

    if (normalizedSteps.length === 0) {
      setNotice({ type: 'error', message: 'Add at least one step before saving.' });
      return null;
    }

    setIsSaving(true);

    const definition: WorkflowDefinition = {
      steps: normalizedSteps,
    };

    try {
      let response: Response | null = null;
      let lastError: unknown = null;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          response = await fetch(`/api/workflows/${workflow.id}/versions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ definition, publish }),
          });
          break;
        } catch (err) {
          lastError = err;
          await sleep(350);
        }
      }

      if (!response) {
        throw lastError instanceof Error
          ? lastError
          : new Error('Network error while saving. Please try again.');
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          typeof data?.error === 'string'
            ? data.error
            : publish
              ? 'Failed to publish workflow.'
              : 'Failed to save workflow.';
        throw new Error(message);
      }

      const savedVersion = data?.version ?? data;

      if (!savedVersion?.id) {
        throw new Error('Save succeeded, but the server returned an invalid response.');
      }

      setSteps(normalizedSteps);
      setNotice({
        type: 'success',
        message: publish ? 'Workflow published successfully.' : 'Draft saved successfully.',
      });

      if (publish) {
        router.refresh();
      }

      return savedVersion;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong while saving.';
      setNotice({ type: 'error', message });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStep = (updatedStep: StepDefinition) => {
    setSteps((current) =>
      current.map((s) => (s.id === updatedStep.id ? updatedStep : s)),
    );
  };

  const handleRunTest = async (input: any) => {
    const savedVersion = await handleSaveWorkflow(false);
    if (!savedVersion?.id) return null;

    const response = await fetch(`/api/workflows/${workflow.id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, versionId: savedVersion.id }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setNotice({
        type: 'error',
        message:
          data?.error || 'Failed to start test execution. Please try again.',
      });
      return null;
    }

    const data = await response.json();
    return data.jobId || null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'design' ? 'default' : 'outline'}
            onClick={() => setActiveTab('design')}
            size="sm"
          >
            Designer
          </Button>
          <Button
            variant={activeTab === 'test' ? 'default' : 'outline'}
            onClick={() => setActiveTab('test')}
            size="sm"
          >
            Test
          </Button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSaveWorkflow(false)}
            disabled={isSaving}
          >
            {isSaving && <Spinner className="h-4 w-4" />}
            Save draft
          </Button>
          <Button size="sm" onClick={() => handleSaveWorkflow(true)} disabled={isSaving}>
            {isSaving && <Spinner className="h-4 w-4" />}
            Publish
          </Button>
        </div>
      </div>

      {notice && (
        <Alert
          variant={
            notice.type === 'error'
              ? 'destructive'
              : notice.type === 'success'
                ? 'success'
                : 'default'
          }
        >
          {notice.message}
        </Alert>
      )}

      <div className="flex min-h-[560px] overflow-hidden rounded-xl border border-slate-200 bg-white">
        <StepLibrary />

        <WorkflowCanvas
          steps={steps}
          onStepsChange={setSteps}
          selectedStepId={selectedStepId}
          onSelectStep={setSelectedStepId}
        />

        <div className="w-80 shrink-0 border-l bg-slate-50">
          {activeTab === 'test' ? (
            <TestPanel workflowId={workflow.id} onRunTest={handleRunTest} />
          ) : selectedStep ? (
            <StepEditor
              step={selectedStep}
              previousSteps={previousSteps}
              onSave={handleUpdateStep}
              onCancel={() => setSelectedStepId(null)}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-sm text-slate-500">
              Select a step to configure it.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
