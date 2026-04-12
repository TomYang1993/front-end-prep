import ivm from 'isolated-vm';
import { RunnerAdapter, RunnerExecutionResult } from '@/lib/runners/types';

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Sandboxed JavaScript function runner using isolated-vm.
 *
 * Security mitigations:
 * - Extremely strict V8 heap isolation (memory limits).
 * - No Node APIs available whatsoever (completely isolated context).
 * - Strict timeout (5s max execution time).
 * - Console bridged using explicit string references.
 */
export class FunctionJsRunner implements RunnerAdapter {
  framework = 'javascript' as const;

  async run(code: string, input: unknown, expected: unknown): Promise<RunnerExecutionResult> {
    const started = Date.now();
    const consoleLogs: string[] = [];
    let isolate: ivm.Isolate | null = null;
    let context: ivm.Context | null = null;

    // Detect input shape. Two supported contracts:
    //   1. Solve-style:     { args: [...] }          → call a `solve` function with args
    //   2. Assertion-style: { setup, assertions[] }  → run user code + setup, eval each assertion expression
    // Assertion-style is used by "fix-the-code" style questions where there is no single function to call.
    const inputObj = (input ?? {}) as {
      args?: unknown[];
      setup?: string;
      assertions?: { expr: string; desc: string }[];
    };
    const isAssertionStyle = Array.isArray(inputObj.assertions);

    try {
      // 1. Transpile TS -> JS
      const esbuild = await import('esbuild');
      const transformResult = await esbuild.transform(code, {
        loader: 'ts',
        target: 'node18',
        format: 'cjs',
      });
      const jsCode = transformResult.code;

      // 2. Initialize the heavily sandboxed V8 Isolate
      isolate = new ivm.Isolate({ memoryLimit: 128 }); // 128 MB heap limit
      context = isolate.createContextSync();
      const jail = context.global;

      // Expose the global object
      jail.setSync('global', jail.derefInto());

      // 3. Create a safe console bridge via Reference
      const logCallback = function(...logs: string[]) {
        consoleLogs.push(logs.join(' '));
      };
      jail.setSync('__logCallback', new ivm.Reference(logCallback));

      const consoleBridge = `
        const console = {
          log: (...args) => global.__logCallback.applySync(undefined, args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a))),
          error: (...args) => global.__logCallback.applySync(undefined, args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a))),
          warn: (...args) => global.__logCallback.applySync(undefined, args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a))),
        };
        global.console = console;

        const exports = {};
        const module = { exports };
        global.exports = exports;
        global.module = module;

        // Disable eval to match strict node:vm codeGeneration settings
        delete global.eval;
      `;

      let setupCode: string;

      if (isAssertionStyle) {
        // User code, setup, and assertions all share the script-level lexical scope,
        // so top-level \`const\` declarations in user code are visible to setup/assertions.
        const setupStr = inputObj.setup || '';
        const assertionsExec = inputObj.assertions!
          .map(
            (a) => `
              try {
                const __r = (${a.expr});
                __assertionResults.push({ desc: ${JSON.stringify(a.desc)}, passed: !!__r });
              } catch (__e) {
                __assertionResults.push({ desc: ${JSON.stringify(a.desc)}, passed: false, error: (__e && __e.message) ? __e.message : String(__e) });
              }
            `
          )
          .join('\n');

        // Everything must share the script-level lexical scope so that top-level
        // \`const\` declarations in user code are visible to setup/assertion code.
        // A nested try { } block would create a new scope and hide them, so we
        // split execution into two phases: user code runs at script top level
        // (uncaught errors propagate to the outer adapter catch), then setup +
        // assertions run in a separate guarded phase inside an IIFE that still
        // closes over the top-level bindings.
        setupCode = `
          ${consoleBridge}

          const __assertionResults = [];
          let __stageError = null;

          ${jsCode}

          (function __runAssertions() {
            try {
              ${setupStr}
              ${assertionsExec}
            } catch (__e) {
              __stageError = "Test setup error: " + ((__e && __e.message) ? __e.message : String(__e));
            }
          })();

          JSON.stringify({ mode: "assertions", assertions: __assertionResults, stageError: __stageError });
        `;
      } else {
        // Legacy solve()-style contract
        const args = inputObj.args || [];
        const serializedArgs = JSON.stringify(args);

        setupCode = `
          ${consoleBridge}

          try {
            ${jsCode}
          } catch (e) {
            throw e;
          }

          let targetFn = module.exports.default || module.exports || exports.default || exports;

          if (typeof targetFn !== 'function') {
            targetFn = typeof solve === 'function' ? solve : undefined;
          }

          if (!targetFn || typeof targetFn !== 'function') {
            const possibleNames = Object.getOwnPropertyNames(global).filter(key => {
              try {
                const val = global[key];
                return typeof val === 'function' && !val.toString().includes('[native code]') && key !== 'console' && key !== '__logCallback';
              } catch {
                return false;
              }
            });
            if (possibleNames.length > 0) {
              targetFn = global[possibleNames[possibleNames.length - 1]];
            }
          }

          let __runnerResult = undefined;
          if (targetFn && typeof targetFn === 'function') {
             const parsedArgs = JSON.parse(${JSON.stringify(serializedArgs)});
             __runnerResult = targetFn(...parsedArgs);
          } else {
             throw new Error("Could not find solving function. Make sure to export default your function.");
          }

          JSON.stringify({ mode: "solve", result: __runnerResult === undefined ? null : __runnerResult });
        `;
      }

      // Compile script (will throw on SyntaxErrors)
      const script = isolate.compileScriptSync(setupCode);

      // Execute with a strict 5000ms limit
      const jsonOutput = script.runSync(context, { timeout: 5000 });
      const parsedOutput = JSON.parse(jsonOutput);

      context.release();
      isolate.dispose();
      isolate = null;
      context = null;

      if (isAssertionStyle) {
        const assertionResults = (parsedOutput.assertions || []) as {
          desc: string;
          passed: boolean;
          error?: string;
        }[];
        const stageError: string | null = parsedOutput.stageError ?? null;

        // If setup failed before any assertions could run, synthesize failures
        // so the UI still shows each expected check as a failed line.
        const finalAssertions =
          stageError && assertionResults.length === 0
            ? (inputObj.assertions || []).map((a) => ({
                desc: a.desc,
                passed: false,
                error: stageError,
              }))
            : assertionResults;

        const allPassed = finalAssertions.length > 0 && finalAssertions.every((a) => a.passed);

        return {
          passed: allPassed,
          output: finalAssertions,
          runtimeMs: Date.now() - started,
          error: stageError || undefined,
          logs: consoleLogs,
        };
      }

      const output = parsedOutput.result;
      return {
        passed: deepEqual(output, expected),
        output,
        runtimeMs: Date.now() - started,
        logs: consoleLogs,
      };
    } catch (error) {
      if (context) {
          try { context.release(); } catch {}
      }
      if (isolate && !isolate.isDisposed) {
          try { isolate.dispose(); } catch {}
      }

      const normalizedMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : JSON.stringify(error);

      return {
        passed: false,
        output: isAssertionStyle
          ? (inputObj.assertions || []).map((a) => ({
              desc: a.desc,
              passed: false,
              error: normalizedMessage,
            }))
          : null,
        runtimeMs: Date.now() - started,
        error: normalizedMessage,
        logs: consoleLogs,
      };
    }
  }
}
