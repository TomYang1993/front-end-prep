import { RunnerAdapter, RunnerExecutionResult } from '@/lib/runners/types';

/**
 * Stub runner for Python questions.
 * Python execution happens client-side via Pyodide in a Web Worker.
 * This stub exists so the runner registry is complete.
 */
export class PythonStubRunner implements RunnerAdapter {
  framework = 'python' as const;

  async run(): Promise<RunnerExecutionResult> {
    return {
      passed: false,
      output: null,
      runtimeMs: 0,
      error:
        'Python execution is handled client-side via Pyodide. This runner should not be called directly.',
    };
  }
}
