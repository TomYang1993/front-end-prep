import { RunnerAdapter, RunnerExecutionResult } from '@/lib/runners/types';

/**
 * React test runner stub.
 * React testing is handled client-side via Sandpack + RTL.
 * This stub exists so the runner registry is complete.
 */
export class ReactPreviewRunner implements RunnerAdapter {
  framework = 'react' as const;

  async run(): Promise<RunnerExecutionResult> {
    return {
      passed: true,
      results: [],
      runtimeMs: 0,
      logs: [],
    };
  }
}
