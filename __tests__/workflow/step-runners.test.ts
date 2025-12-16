import { describe, it, expect } from 'vitest';
import { DelayRunner } from '@/lib/workflow/step-runners/delay';
import { ConditionalRunner } from '@/lib/workflow/step-runners/conditional';
import { TransformRunner } from '@/lib/workflow/step-runners/transform';
import type { ExecutionContext } from '@/lib/types/workflow.types';

const createMockContext = (input = {}, variables = {}): ExecutionContext => ({
  executionId: 'test-exec-1',
  workflowId: 'test-workflow-1',
  versionId: 'test-version-1',
  input,
  variables,
  metadata: {},
});

describe('DelayRunner', () => {
  it('should delay execution', async () => {
    const runner = new DelayRunner();
    const config = { milliseconds: 100 };
    const context = createMockContext();

    const startTime = Date.now();
    const result = await runner.run(config, context);
    const duration = Date.now() - startTime;

    expect(result.success).toBe(true);
    expect(duration).toBeGreaterThanOrEqual(90);
    expect(result.output).toEqual({ delayed: 100 });
  });

  it('should reject negative delays', async () => {
    const runner = new DelayRunner();
    const config = { milliseconds: -100 };
    const context = createMockContext();

    const result = await runner.run(config, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('non-negative');
  });

  it('should reject excessively long delays', async () => {
    const runner = new DelayRunner();
    const config = { milliseconds: 400000 };
    const context = createMockContext();

    const result = await runner.run(config, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('exceed');
  });
});

describe('ConditionalRunner', () => {
  it('should evaluate true condition', async () => {
    const runner = new ConditionalRunner();
    const config = {
      condition: 'variables.count > 5',
      trueSteps: ['step1', 'step2'],
      falseSteps: ['step3'],
    };
    const context = createMockContext({}, { count: 10 });

    const result = await runner.run(config, context);

    expect(result.success).toBe(true);
    expect(result.output.condition).toBe(true);
    expect(result.output.nextSteps).toEqual(['step1', 'step2']);
  });

  it('should evaluate false condition', async () => {
    const runner = new ConditionalRunner();
    const config = {
      condition: 'variables.count > 5',
      trueSteps: ['step1', 'step2'],
      falseSteps: ['step3'],
    };
    const context = createMockContext({}, { count: 3 });

    const result = await runner.run(config, context);

    expect(result.success).toBe(true);
    expect(result.output.condition).toBe(false);
    expect(result.output.nextSteps).toEqual(['step3']);
  });
});

describe('TransformRunner', () => {
  it('should execute JavaScript transformation', async () => {
    const runner = new TransformRunner();
    const config = {
      code: `
        const doubled = input.value * 2;
        return { result: doubled };
      `,
    };
    const context = createMockContext({}, { value: 5 });

    const result = await runner.run(config, context);

    expect(result.success).toBe(true);
    expect(result.output).toEqual({ result: 10 });
  });

  it('should handle transformation errors', async () => {
    const runner = new TransformRunner();
    const config = {
      code: `
        throw new Error('Test error');
      `,
    };
    const context = createMockContext();

    const result = await runner.run(config, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Transform execution failed');
  });

  it('should support input and output mapping', async () => {
    const runner = new TransformRunner();
    const config = {
      code: `
        return { doubled: input.num * 2 };
      `,
      inputMapping: {
        num: '{{variables.value}}',
      },
    };
    const context = createMockContext({}, { value: 7 });

    const result = await runner.run(config, context);

    expect(result.success).toBe(true);
    expect(result.output).toHaveProperty('doubled');
    expect(result.output.doubled).toBe(14);
  });
});
