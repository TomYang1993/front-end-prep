import vm from 'node:vm';
import { RunnerAdapter, RunnerExecutionResult } from '@/lib/runners/types';

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Sandboxed JavaScript function runner using Node's vm module.
 *
 * Security mitigations:
 * - Frozen console object (no prototype pollution via console)
 * - No access to require, process, or global Node APIs
 * - Strict timeout (5s max)
 * - Context has no prototype chain to the outer global
 */
export class FunctionJsRunner implements RunnerAdapter {
  framework = 'javascript' as const;

  async run(code: string, input: unknown, expected: unknown): Promise<RunnerExecutionResult> {
    const started = Date.now();

    try {
      // Create a minimal sandbox with no access to Node internals
      const sandbox: Record<string, unknown> = {
        console: Object.freeze({
          log: (...args: unknown[]) => void args,
          warn: (...args: unknown[]) => void args,
          error: (...args: unknown[]) => void args,
        }),
        Math: Object.freeze(Math),
        JSON: Object.freeze(JSON),
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        Array,
        Object,
        String,
        Number,
        Boolean,
        Map,
        Set,
        Date,
        RegExp,
        Error,
        TypeError,
        RangeError,
        Promise,
        Symbol,
        BigInt,
        undefined,
        NaN,
        Infinity,
      };

      const context = vm.createContext(sandbox, {
        codeGeneration: {
          strings: false,  // Disable eval() inside sandbox
          wasm: false,     // Disable WebAssembly inside sandbox
        },
      }) as vm.Context & {
        __runnerArgs?: unknown[];
        __runnerResult?: unknown;
      };

      const wrapped = `
${code}
if (typeof solve !== 'function') {
  throw new Error('Expected a solve function');
}
globalThis.__runnerResult = solve(...(__runnerArgs || []));
`;

      const args = (input as { args?: unknown[] })?.args || [];
      context.__runnerArgs = args;
      vm.runInContext(wrapped, context, { timeout: 5_000 });
      const output = context.__runnerResult;

      return {
        passed: deepEqual(output, expected),
        output,
        runtimeMs: Date.now() - started,
      };
    } catch (error) {
      const normalizedMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : JSON.stringify(error);

      return {
        passed: false,
        output: null,
        runtimeMs: Date.now() - started,
        error: normalizedMessage,
      };
    }
  }
}
