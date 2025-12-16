'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StepDefinition, StepType } from '@/lib/types/workflow.types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface StepEditorProps {
  step: StepDefinition;
  previousSteps?: StepDefinition[];
  onSave: (step: StepDefinition) => void;
  onCancel: () => void;
}

const STEP_TYPES: { value: StepType; label: string }[] = [
  { value: 'http_request', label: 'HTTP Request' },
  { value: 'transform', label: 'Transform' },
  { value: 'conditional', label: 'Conditional' },
  { value: 'loop', label: 'Loop' },
  { value: 'delay', label: 'Delay' },
  { value: 'custom_code', label: 'Custom Code' },
];

export function StepEditor({ step: initialStep, previousSteps = [], onSave, onCancel }: StepEditorProps) {
  const [step, setStep] = useState<StepDefinition>(initialStep);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(step);
  };

  const handleConfigChange = (key: string, value: any) => {
    setStep({
      ...step,
      config: {
        ...step.config,
        [key]: value,
      },
    });
  };

  const copyVariable = (path: string) => {
    navigator.clipboard.writeText(`{{${path}}}`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-white">
        <h3 className="font-semibold text-lg">{step.name ? `Edit: ${step.name}` : 'Edit Step'}</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Step Name</Label>
            <Input
              id="name"
              value={step.name}
              onChange={(e) => setStep({ ...step, name: e.target.value })}
              placeholder="e.g., Fetch user data"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Step Type</Label>
            <Select
              id="type"
              value={step.type}
              onChange={(e) => setStep({ ...step, type: e.target.value as StepType })}
            >
              {STEP_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>

          {step.type === 'http_request' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={step.config.url || ''}
                  onChange={(e) => handleConfigChange('url', e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Method</Label>
                <Select
                  id="method"
                  value={step.config.method || 'GET'}
                  onChange={(e) => handleConfigChange('method', e.target.value)}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headers">Headers (JSON)</Label>
                <Textarea
                  id="headers"
                  value={step.config.headers ? JSON.stringify(step.config.headers, null, 2) : ''}
                  onChange={(e) => {
                    try {
                      const headers = JSON.parse(e.target.value);
                      handleConfigChange('headers', headers);
                    } catch {
                      // Invalid JSON, don't update
                    }
                  }}
                  placeholder='{"Authorization": "Bearer token"}'
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Body (JSON)</Label>
                <Textarea
                  id="body"
                  value={step.config.body ? JSON.stringify(step.config.body, null, 2) : ''}
                  onChange={(e) => {
                    try {
                      const body = JSON.parse(e.target.value);
                      handleConfigChange('body', body);
                    } catch {
                      // Invalid JSON, don't update
                    }
                  }}
                  placeholder='{"key": "value"}'
                />
              </div>
            </>
          )}

          {step.type === 'transform' && (
            <div className="space-y-2">
              <Label htmlFor="code">JavaScript Code</Label>
              <Textarea
                id="code"
                value={step.config.code || ''}
                onChange={(e) => handleConfigChange('code', e.target.value)}
                placeholder="// Transform the input data
return { transformed: input };"
              />
            </div>
          )}

          {step.type === 'conditional' && (
            <div className="space-y-2">
              <Label htmlFor="condition">Condition (JS Expression)</Label>
              <Textarea
                id="condition"
                value={step.config.condition || ''}
                onChange={(e) => handleConfigChange('condition', e.target.value)}
                placeholder="variables.stepName.output.value > 10"
              />
              <p className="text-xs text-slate-500">
                Return true or false. Available: input, variables.
              </p>
            </div>
          )}

          {step.type === 'delay' && (
            <div className="space-y-2">
              <Label htmlFor="milliseconds">Milliseconds</Label>
              <Input
                id="milliseconds"
                type="number"
                value={step.config.milliseconds || 1000}
                onChange={(e) =>
                  handleConfigChange('milliseconds', parseInt(e.target.value))
                }
                placeholder="1000"
              />
            </div>
          )}

          {step.type === 'custom_code' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  id="language"
                  value={step.config.language || 'javascript'}
                  onChange={(e) => handleConfigChange('language', e.target.value)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customCode">Code</Label>
                <Textarea
                  id="customCode"
                  value={step.config.code || ''}
                  onChange={(e) => handleConfigChange('code', e.target.value)}
                  placeholder="// Your custom code here"
                />
              </div>
            </>
          )}

          <div className="pt-4 flex gap-2">
             <Button type="submit" size="sm">Update Step</Button>
             <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Close</Button>
          </div>
        </form>

        {previousSteps.length > 0 && (
          <div className="mt-8 border-t pt-4">
             <h4 className="text-sm font-semibold mb-2">Available Variables</h4>
             <p className="text-xs text-slate-500 mb-2">Click to copy path</p>
             <div className="space-y-2">
               {previousSteps.map(s => (
                 <div key={s.id} className="text-xs">
                   <div className="font-medium text-slate-700 mb-1">{s.name}</div>
                   <div 
                     className="bg-slate-100 p-1 rounded cursor-pointer hover:bg-slate-200 truncate font-mono"
                     onClick={() => copyVariable(`${s.name}.output`)}
                     title="Click to copy"
                   >
                     {`{{${s.name}.output}}`}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
