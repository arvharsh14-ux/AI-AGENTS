import vm from 'vm';
import { spawn } from 'child_process';
import { BaseStepRunner } from './base';
import type { ExecutionContext, CustomCodeConfig, StepResult } from '@/lib/types/workflow.types';

export class CustomCodeRunner extends BaseStepRunner {
  async run(config: CustomCodeConfig, context: ExecutionContext): Promise<StepResult> {
    if (config.language === 'javascript') {
      return this.runJavaScript(config, context);
    } else if (config.language === 'python') {
      return this.runPython(config, context);
    } else {
      return this.createErrorResult(`Unsupported language: ${config.language}`);
    }
  }

  private async runJavaScript(config: CustomCodeConfig, context: ExecutionContext): Promise<StepResult> {
    try {
      const sandbox = {
        input: context.input,
        variables: context.variables,
        metadata: context.metadata,
        console: {
          log: (...args: any[]) => console.log('[CustomCode:JS]', ...args),
        },
        result: undefined,
      };

      const script = new vm.Script(`
        result = (async function() {
          ${config.code}
        })();
      `);

      const vmContext = vm.createContext(sandbox);
      script.runInContext(vmContext, {
        timeout: config.timeout || 10000,
        displayErrors: true,
      });

      const result = await sandbox.result;

      return this.createSuccessResult(result);
    } catch (error: any) {
      return this.createErrorResult(
        `JavaScript execution failed: ${error.message}`
      );
    }
  }

  private async runPython(config: CustomCodeConfig, context: ExecutionContext): Promise<StepResult> {
    try {
      const inputJson = JSON.stringify({
        input: context.input,
        variables: context.variables,
        metadata: context.metadata,
      });

      const pythonCode = `
import json
import sys

context = json.loads('''${inputJson.replace(/'/g, "\\'")}''')
input_data = context['input']
variables = context['variables']
metadata = context['metadata']

${config.code}

if 'result' in locals():
    print(json.dumps(result))
`;

      const result = await this.executePython(pythonCode, config.timeout || 10000);

      let parsedResult;
      try {
        parsedResult = JSON.parse(result);
      } catch {
        parsedResult = result;
      }

      return this.createSuccessResult(parsedResult);
    } catch (error: any) {
      return this.createErrorResult(
        `Python execution failed: ${error.message}`
      );
    }
  }

  private executePython(code: string, timeout: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', ['-c', code]);
      
      let stdout = '';
      let stderr = '';

      const timer = setTimeout(() => {
        python.kill();
        reject(new Error('Python execution timeout'));
      }, timeout);

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        clearTimeout(timer);
        
        if (code !== 0) {
          reject(new Error(stderr || 'Python execution failed'));
        } else {
          resolve(stdout.trim());
        }
      });

      python.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }
}
