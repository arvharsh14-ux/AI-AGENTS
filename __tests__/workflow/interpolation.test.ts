import { describe, it, expect } from 'vitest';
import { interpolateVariables, evaluateCondition } from '@/lib/workflow/interpolation';

describe('interpolateVariables', () => {
  it('should interpolate simple string variables', () => {
    const template = 'Hello {{name}}!';
    const context = { name: 'World' };
    const result = interpolateVariables(template, context);
    expect(result).toBe('Hello World!');
  });

  it('should interpolate nested object properties', () => {
    const template = 'User: {{user.name}}, Age: {{user.age}}';
    const context = { user: { name: 'John', age: 30 } };
    const result = interpolateVariables(template, context);
    expect(result).toBe('User: John, Age: 30');
  });

  it('should interpolate array elements', () => {
    const template = 'First: {{items[0]}}, Second: {{items[1]}}';
    const context = { items: ['apple', 'banana'] };
    const result = interpolateVariables(template, context);
    expect(result).toBe('First: apple, Second: banana');
  });

  it('should return entire value when template is single variable', () => {
    const template = '{{data}}';
    const context = { data: { key: 'value' } };
    const result = interpolateVariables(template, context);
    expect(result).toEqual({ key: 'value' });
  });

  it('should interpolate objects recursively', () => {
    const template = {
      greeting: 'Hello {{name}}',
      info: {
        age: '{{age}}',
      },
    };
    const context = { name: 'Alice', age: 25 };
    const result = interpolateVariables(template, context);
    expect(result).toEqual({
      greeting: 'Hello Alice',
      info: {
        age: 25,
      },
    });
  });

  it('should interpolate arrays', () => {
    const template = ['{{first}}', '{{second}}'];
    const context = { first: 'one', second: 'two' };
    const result = interpolateVariables(template, context);
    expect(result).toEqual(['one', 'two']);
  });
});

describe('evaluateCondition', () => {
  it('should evaluate simple boolean conditions', () => {
    const condition = 'value > 10';
    const context = { value: 15 };
    const result = evaluateCondition(condition, context);
    expect(result).toBe(true);
  });

  it('should evaluate string comparisons', () => {
    const condition = 'status === "active"';
    const context = { status: 'active' };
    const result = evaluateCondition(condition, context);
    expect(result).toBe(true);
  });

  it('should evaluate complex conditions', () => {
    const condition = 'age >= 18 && hasLicense === true';
    const context = { age: 25, hasLicense: true };
    const result = evaluateCondition(condition, context);
    expect(result).toBe(true);
  });

  it('should return false for invalid conditions', () => {
    const condition = 'invalid.property.access';
    const context = { value: 10 };
    const result = evaluateCondition(condition, context);
    expect(result).toBe(false);
  });
});
