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

      // Prepare arguments securely to pass as a JSON string so script can parse it
      const args = (input as { args?: unknown[] })?.args || [];
      const serializedArgs = JSON.stringify(args);

      // 3. Create a safe console bridge via Reference
      const logCallback = function(...logs: string[]) {
        consoleLogs.push(logs.join(' '));
      };
      jail.setSync('__logCallback', new ivm.Reference(logCallback));

      // 4. Create the setup wrapper inside the isolate
      // It mocks console, runs JS, finds solve/exported fn, executes it, and returns JSON.
      const setupCode = `
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

        JSON.stringify({ result: __runnerResult === undefined ? null : __runnerResult });
      `;

      // Compile script (will throw on SyntaxErrors)
      const script = isolate.compileScriptSync(setupCode);
      
      // Execute with a strict 5000ms limit
      const jsonOutput = script.runSync(context, { timeout: 5000 });
      const parsedOutput = JSON.parse(jsonOutput);
      const output = parsedOutput.result;

      context.release();
      isolate.dispose();
      isolate = null;
      context = null;

      return {
        passed: deepEqual(output, expected),
        output,
        runtimeMs: Date.now() - started,
        logs: consoleLogs,
      };
    } catch (error) {
      if (context) {
          try { context.release(); } catch(e) {}
      }
      if (isolate && !isolate.isDisposed) {
          try { isolate.dispose(); } catch(e) {}
      }

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
        logs: consoleLogs,
      };
    }
  }
}
