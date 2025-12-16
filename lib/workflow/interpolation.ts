export function interpolateVariables(
  template: any,
  context: Record<string, any>
): any {
  if (typeof template === 'string') {
    return interpolateString(template, context);
  }

  if (Array.isArray(template)) {
    return template.map((item) => interpolateVariables(item, context));
  }

  if (template && typeof template === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(template)) {
      result[key] = interpolateVariables(value, context);
    }
    return result;
  }

  return template;
}

function interpolateString(template: string, context: Record<string, any>): any {
  const variablePattern = /\{\{([^}]+)\}\}/g;
  
  const matches = template.match(variablePattern);
  
  if (!matches) {
    return template;
  }

  if (matches.length === 1 && matches[0] === template) {
    const path = matches[0].slice(2, -2).trim();
    return getValueByPath(context, path);
  }

  return template.replace(variablePattern, (match, path) => {
    const value = getValueByPath(context, path.trim());
    return value !== undefined ? String(value) : match;
  });
}

function getValueByPath(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current = current[key];
      if (Array.isArray(current)) {
        current = current[parseInt(index, 10)];
      } else {
        return undefined;
      }
    } else {
      current = current[part];
    }
  }

  return current;
}

export function evaluateCondition(
  condition: string,
  context: Record<string, any>
): boolean {
  try {
    const interpolated = interpolateString(condition, context);
    
    const func = new Function(
      ...Object.keys(context),
      `return ${interpolated};`
    );
    
    return Boolean(func(...Object.values(context)));
  } catch (error) {
    console.error('Error evaluating condition:', error);
    return false;
  }
}
