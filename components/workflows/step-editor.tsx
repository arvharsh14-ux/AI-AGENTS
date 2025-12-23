'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { StepDefinition, StepType } from '@/lib/types/workflow.types';

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

function stringifyJson(value: unknown) {
  if (value === undefined || value === null) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
}

export function StepEditor({
  step: initialStep,
  previousSteps = [],
  onSave,
  onCancel,
}: StepEditorProps) {
  const [step, setStep] = useState<StepDefinition>(initialStep);

  const [headersText, setHeadersText] = useState(() => stringifyJson(initialStep.config?.headers));
  const [headersError, setHeadersError] = useState<string | null>(null);

  const [bodyText, setBodyText] = useState(() => stringifyJson(initialStep.config?.body));
  const [bodyError, setBodyError] = useState<string | null>(null);

  const [responseMappingText, setResponseMappingText] = useState(() => stringifyJson(initialStep.config?.responseMapping));
  const [responseMappingError, setResponseMappingError] = useState<string | null>(null);

  useEffect(() => {
    setStep(initialStep);
    setHeadersText(stringifyJson(initialStep.config?.headers));
    setHeadersError(null);
    setBodyText(stringifyJson(initialStep.config?.body));
    setBodyError(null);
    setResponseMappingText(stringifyJson(initialStep.config?.responseMapping));
    setResponseMappingError(null);
  }, [initialStep]);

  const previousStepVariables = useMemo(
    () =>
      previousSteps.map((s) => ({
        id: s.id,
        name: s.name,
        value: `{{${s.name}.output}}`,
        path: `${s.name}.output`,
      })),
    [previousSteps],
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(step);
  };

  const handleConfigChange = (key: string, value: any) => {
    setStep((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value,
      },
    }));
  };

  const handleJsonFieldChange = (
    text: string,
    {
      key,
      setText,
      setError,
    }: {
      key: string;
      setText: (v: string) => void;
      setError: (v: string | null) => void;
    },
  ) => {
    setText(text);

    if (!text.trim()) {
      setError(null);
      handleConfigChange(key, undefined);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      setError(null);
      handleConfigChange(key, parsed);
    } catch {
      setError('Invalid JSON');
    }
  };

  const copyVariable = async (path: string) => {
    await navigator.clipboard.writeText(`{{${path}}}`);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-white p-4">
        <h3 className="text-base font-semibold text-slate-900">
          {step.name ? `Edit: ${step.name}` : 'Edit Step'}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Configure how this step behaves and what it outputs.
        </p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
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
                <Label htmlFor="connector">Connector (optional)</Label>
                <Select
                  id="connector"
                  value={step.config.connectorInstanceId || ''}
                  onChange={(e) =>
                    handleConfigChange(
                      'connectorInstanceId',
                      e.target.value || undefined,
                    )
                  }
                >
                  <option value="">None</option>
                  {[] /* TODO */.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-slate-500">
                  Connectors store base URLs and auth.
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
                  required
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
                  value={headersText}
                  onChange={(e) =>
                    handleJsonFieldChange(e.target.value, {
                      key: 'headers',
                      setText: setHeadersText,
                      setError: setHeadersError,
                    })
                  }
                  placeholder='{"Content-Type": "application/json"}'
                  className="font-mono text-xs"
                  aria-invalid={Boolean(headersError)}
                />
                {headersError && (
                  <p className="text-xs text-red-600">{headersError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Body (JSON)</Label>
                <Textarea
                  id="body"
                  value={bodyText}
                  onChange={(e) =>
                    handleJsonFieldChange(e.target.value, {
                      key: 'body',
                      setText: setBodyText,
                      setError: setBodyError,
                    })
                  }
                  placeholder='{"key": "value"}'
                  className="font-mono text-xs"
                  aria-invalid={Boolean(bodyError)}
                />
                {bodyError && <p className="text-xs text-red-600">{bodyError}</p>}
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
                <Label htmlFor="responseMapping">Response mapping (JSON template)</Label>
                <Textarea
                  id="responseMapping"
                  value={responseMappingText}
                  onChange={(e) =>
                    handleJsonFieldChange(e.target.value, {
                      key: 'responseMapping',
                      setText: setResponseMappingText,
                      setError: setResponseMappingError,
                    })
                  }
                  placeholder='{"id": "{{response.data.id}}"}'
                  className="font-mono text-xs"
                  aria-invalid={Boolean(responseMappingError)}
                />
                {responseMappingError && (
                  <p className="text-xs text-red-600">{responseMappingError}</p>
                )}
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
                placeholder="// Transform the input data\nreturn { transformed: input };"
                className="font-mono text-xs"
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
                className="font-mono text-xs"
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
                value={step.config.milliseconds ?? 1000}
                onChange={(e) =>
                  handleConfigChange(
                    'milliseconds',
                    Number.isFinite(Number(e.target.value))
                      ? Number(e.target.value)
                      : 0,
                  )
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
                  className="font-mono text-xs"
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" size="sm">
              Update step
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Close
            </Button>
          </div>
        </form>

        {previousStepVariables.length > 0 && (
          <div className="border-t pt-6">
            <h4 className="text-sm font-semibold text-slate-900">
              Available variables
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              Click to copy.
            </p>

            <div className="mt-4 space-y-3">
              {previousStepVariables.map((s) => (
                <div key={s.id} className="text-xs">
                  <div className="mb-1 font-medium text-slate-700">{s.name}</div>
                  <button
                    type="button"
                    className="w-full truncate rounded-md border border-slate-200 bg-white px-2 py-1 text-left font-mono text-[11px] text-slate-600 hover:bg-slate-50"
                    onClick={() => copyVariable(s.path)}
                    title="Click to copy"
                  >
                    {s.value}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
