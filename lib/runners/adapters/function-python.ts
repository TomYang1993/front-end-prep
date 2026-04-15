import { RunnerAdapter, RunnerExecutionResult } from '@/lib/runners/types';

/**
 * Python test runner stub.
 * Python execution is handled client-side via Pyodide in a Web Worker.
 * This stub exists so the runner registry is complete.
 */
export class PythonStubRunner implements RunnerAdapter {
  framework = 'python' as const;

  async run(): Promise<RunnerExecutionResult> {
    return {
      passed: false,
      results: [{ name: 'Python Stub', passed: false, error: 'Python execution is handled client-side via Pyodide.' }],
      runtimeMs: 0,
      logs: [],
    };
  }
}
