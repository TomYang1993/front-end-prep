import { RunnerAdapter, RunnerExecutionResult } from '@/lib/runners/types';

/**
 * JS test runner stub.
 * JS execution is handled client-side via a Web Worker (see hooks/use-js-runner.ts).
 * This stub exists so the runner registry is complete.
 */
export class FunctionJsRunner implements RunnerAdapter {
  framework = 'javascript' as const;

  async run(): Promise<RunnerExecutionResult> {
    return {
      passed: false,
      results: [
        {
          name: 'JS Stub',
          passed: false,
          error: 'JS execution is handled client-side via a Web Worker.',
        },
      ],
      runtimeMs: 0,
      logs: [],
    };
  }
}
