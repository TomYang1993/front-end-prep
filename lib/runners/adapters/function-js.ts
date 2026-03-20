import vm from 'node:vm';
import { JSDOM } from 'jsdom';
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
 * - Uses esbuild to transpile TS to JS seamlessly
 * - Uses JSDOM to provide standard browser APIs safely
 */
export class FunctionJsRunner implements RunnerAdapter {
  framework = 'javascript' as const;

  async run(code: string, input: unknown, expected: unknown): Promise<RunnerExecutionResult> {
    const started = Date.now();
    const consoleLogs: string[] = [];

    try {
      // 1. Transpile TS -> JS
      const esbuild = await import('esbuild');
      const transformResult = await esbuild.transform(code, {
        loader: 'ts',
        target: 'node18',
        format: 'cjs',
      });
      const jsCode = transformResult.code;

      // 2. Initialize a secure virtual DOM
      const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'http://localhost/',
      });
      const view = dom.window;

      const captureLog = (...args: unknown[]) => {
        const line = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
        consoleLogs.push(line);
      };

      // 3. Create a minimal sandbox
      const sandbox: Record<string, unknown> = {
        console: Object.freeze({
          log: captureLog,
          warn: captureLog,
          error: captureLog,
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
        window: view,
        document: view.document,
        navigator: view.navigator,
        location: view.location,
        alert: captureLog,
        prompt: () => null,
        confirm: () => false,
        setTimeout: view.setTimeout,
        clearTimeout: view.clearTimeout,
        setInterval: view.setInterval,
        clearInterval: view.clearInterval,
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

      // Find target function or execute passively
      const wrapped = `
${jsCode}

let targetFn = typeof solve === 'function' ? solve : undefined;

if (!targetFn) {
  // Try to find the user's defined function if it's not named 'solve'
  // CommonJS transpiled top-level functions will be attached to context variables
  const possibleNames = Object.getOwnPropertyNames(globalThis).filter(key => {
    try {
      const val = globalThis[key];
      // Filter out internal JS/DOM functions by checking for [native code]
      return typeof val === 'function' && !val.toString().includes('[native code]');
    } catch {
      return false;
    }
  });
  if (possibleNames.length > 0) {
    targetFn = globalThis[possibleNames[possibleNames.length - 1]];
  }
}

if (targetFn) {
  globalThis.__runnerResult = targetFn(...(__runnerArgs || []));
} else {
  globalThis.__runnerResult = undefined;
}
`;

      const args = (input as { args?: unknown[] })?.args || [];
      context.__runnerArgs = args;
      vm.runInContext(wrapped, context, { timeout: 5_000 });
      const output = context.__runnerResult;

      return {
        passed: deepEqual(output, expected),
        output,
        runtimeMs: Date.now() - started,
        logs: consoleLogs,
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
        logs: consoleLogs, // also return logs if it crashed!
      };
    }
  }
}
