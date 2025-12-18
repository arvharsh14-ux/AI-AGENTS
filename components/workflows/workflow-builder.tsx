'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { StepLibrary } from './step-library';
import { WorkflowCanvas } from './workflow-canvas';
import { StepEditor } from './step-editor';
import { TestPanel } from './test-panel';
import type { Workflow, WorkflowVersion } from '@prisma/client';
import type { WorkflowDefinition, StepDefinition } from '@/lib/types/workflow.types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

export function WorkflowBuilder({ workflow, version }: WorkflowBuilderProps) {
  const [steps, setSteps] = useState<StepDefinition[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('design');

  useEffect(() => {
    const definition = version.definition as unknown as WorkflowDefinition;
    if (definition.steps) {
      // Ensure steps have layout if missing
      const stepsWithLayout = definition.steps.map((step, index) => ({
        ...step,
        layout: step.layout || { x: 100 + (index * 50), y: 100 + (index * 80) }
      }));
      setSteps(stepsWithLayout);
    }
  }, [version]);

  const handleSaveWorkflow = async (publish = false) => {
    setIsSaving(true);
    try {
      const definition: WorkflowDefinition = {
        steps,
      };

      const response = await fetch(`/api/workflows/${workflow.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ definition, publish }),
      });

      if (!response.ok) {
        throw new Error('Failed to save workflow');
      }
      
      return await response.json(); // Return new version info
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStep = (updatedStep: any) => {
    setSteps(steps.map((s) => (s.id === updatedStep.id ? updatedStep : s)));
  };

  const handleDeleteStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id));
    if (selectedStepId === id) setSelectedStepId(null);
  };

  const handleRunTest = async (input: any) => {
    // 1. Save current draft as new version
    const savedVersion = await handleSaveWorkflow(false);
    
    if (!savedVersion) return null;

    // 2. Trigger execution with versionId
    const response = await fetch(`/api/workflows/${workflow.id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input,
        versionId: savedVersion.id
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.jobId;
    }
    return null;
  };

  const selectedStepIndex = steps.findIndex(s => s.id === selectedStepId);
  const selectedStep = selectedStepIndex >= 0 ? steps[selectedStepIndex] : null;
  const previousSteps = selectedStepIndex >= 0 ? steps.slice(0, selectedStepIndex) : [];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button variant={activeTab === 'design' ? 'default' : 'outline'} onClick={() => setActiveTab('design')} size="sm">
            Designer
          </Button>
          <Button variant={activeTab === 'test' ? 'default' : 'outline'} onClick={() => setActiveTab('test')} size="sm">
            Test
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSaveWorkflow(false)}
            disabled={isSaving}
          >
            Save Draft
          </Button>
          <Button
            size="sm"
            onClick={() => handleSaveWorkflow(true)}
            disabled={isSaving}
          >
            Publish
          </Button>
        </div>
      </div>

      <div className="flex flex-1 border rounded-lg overflow-hidden bg-white">
        {/* Sidebar Library */}
        <StepLibrary />

        {/* Canvas Area */}
        <WorkflowCanvas
          steps={steps}
          onStepsChange={setSteps}
          selectedStepId={selectedStepId}
          onSelectStep={setSelectedStepId}
        />

        {/* Right Panel: Inspector or Test */}
        <div className="w-80 border-l bg-slate-50 overflow-y-auto">
          {activeTab === 'test' ? (
            <TestPanel workflowId={workflow.id} onRunTest={handleRunTest} />
          ) : (
            selectedStep ? (
              <StepEditor
                step={selectedStep}
                previousSteps={previousSteps}
                onSave={handleUpdateStep}
                onCancel={() => setSelectedStepId(null)}
              />
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm">
                Select a step to configure it
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
