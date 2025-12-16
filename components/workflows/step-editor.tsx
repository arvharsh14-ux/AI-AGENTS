'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WorkflowConnector } from './connectors-manager';

interface Step {
  id: string;
  name: string;
  type: 'http_request' | 'transform' | 'conditional' | 'loop' | 'delay' | 'error_handler' | 'fallback' | 'custom_code';
  config: Record<string, any>;
  position: number;
}

interface StepEditorProps {
  step: Step;
  connectors: WorkflowConnector[];
  onSave: (step: Step) => void;
  onCancel: () => void;
}

const STEP_TYPES = [
  { value: 'http_request', label: 'HTTP Request' },
  { value: 'transform', label: 'Transform' },
  { value: 'conditional', label: 'Conditional' },
  { value: 'loop', label: 'Loop' },
  { value: 'delay', label: 'Delay' },
  { value: 'custom_code', label: 'Custom Code' },
];

export function StepEditor({
  step: initialStep,
  connectors,
  onSave,
  onCancel,
}: StepEditorProps) {
  const [step, setStep] = useState<Step>(initialStep);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {step.name ? `Edit: ${step.name}` : 'Add New Step'}
        </CardTitle>
      </CardHeader>
      <CardContent>
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
              onChange={(e) => setStep({ ...step, type: e.target.value as Step['type'] })}
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
                <Label htmlFor="connector">Connector (optional)</Label>
                <Select
                  id="connector"
                  value={step.config.connectorInstanceId || ''}
                  onChange={(e) =>
                    handleConfigChange(
                      'connectorInstanceId',
                      e.target.value || undefined
                    )
                  }
                >
                  <option value="">None</option>
                  {connectors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-slate-500">
                  Connectors store base URLs and auth. Select one to
                  automatically add auth headers.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="path">Path (optional)</Label>
                <Input
                  id="path"
                  value={step.config.path || ''}
                  onChange={(e) => handleConfigChange('path', e.target.value)}
                  placeholder="/v1/resource"
                />
                <p className="text-xs text-slate-500">
                  If set, this will be joined with the connector base URL.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={step.config.url || ''}
                  onChange={(e) => handleConfigChange('url', e.target.value)}
                  placeholder="https://api.example.com/endpoint or /endpoint"
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
                  value={
                    step.config.headers
                      ? JSON.stringify(step.config.headers, null, 2)
                      : ''
                  }
                  onChange={(e) => {
                    try {
                      const headers = JSON.parse(e.target.value);
                      handleConfigChange('headers', headers);
                    } catch {
                      // Invalid JSON, don't update
                    }
                  }}
                  placeholder='{"Content-Type": "application/json"}'
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

              <div className="space-y-2">
                <Label htmlFor="responsePath">Response path (optional)</Label>
                <Input
                  id="responsePath"
                  value={step.config.responsePath || ''}
                  onChange={(e) =>
                    handleConfigChange('responsePath', e.target.value)
                  }
                  placeholder="data.id"
                />
                <p className="text-xs text-slate-500">
                  Sets <code>output.mapped</code> to a value from the response.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responseMapping">
                  Response mapping (JSON template)
                </Label>
                <Textarea
                  id="responseMapping"
                  value={
                    step.config.responseMapping
                      ? JSON.stringify(step.config.responseMapping, null, 2)
                      : ''
                  }
                  onChange={(e) => {
                    try {
                      const mapping = JSON.parse(e.target.value);
                      handleConfigChange('responseMapping', mapping);
                    } catch {
                      // Invalid JSON, don't update
                    }
                  }}
                  placeholder='{"id": "{{response.data.id}}"}'
                />
                <p className="text-xs text-slate-500">
                  Use <code>{'{{response.data}}'}</code> and workflow variables.
                </p>
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

          <div className="flex gap-4 pt-4">
            <Button type="submit">
              {initialStep.id ? 'Update Step' : 'Add Step'}
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
