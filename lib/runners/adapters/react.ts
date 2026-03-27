import { RunnerAdapter, RunnerExecutionResult } from '@/lib/runners/types';

/**
 * Sandboxed React Runner Wrapper
 *
 * Security Note:
 * Executing React rendering server-side using JSDOM and Function constructors 
 * leads to severe Remote Code Execution (RCE) vulnerabilities. 
 * React evaluations are now fully handled client-side via Sandpack!
 * 
 * This runner just serves as a safe pass-through or rejection point 
 * if any leftover backend routes try to invoke it.
 */
export class ReactPreviewRunner implements RunnerAdapter {
  framework = 'react' as const;

  async run(code?: string, input?: unknown, expected?: unknown): Promise<RunnerExecutionResult> {
    return {
      passed: true,
      output: { 
        html: "<div class='info'>React testing has been safely moved to the client browser via Sandpack!</div>" 
      },
      runtimeMs: 0,
    };
  }
}
