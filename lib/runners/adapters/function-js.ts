import ivm from 'isolated-vm';
import { RunnerAdapter, RunnerExecutionResult } from '@/lib/runners/types';
import { TEST_HARNESS_CODE, TEST_COLLECT_CODE } from '@/lib/runners/test-harness';

/**
 * Sandboxed JavaScript test runner using isolated-vm.
 *
 * Executes user code + test code inside a V8 isolate with:
 * - Mini test/expect harness (no Jest dependency)
 * - Console.log capture via safe bridge
 * - 128MB heap limit, 5s timeout
 * - No Node.js APIs available
 */
export class FunctionJsRunner implements RunnerAdapter {
  framework = 'javascript' as const;

  async run(code: string, testCode: string): Promise<RunnerExecutionResult> {
    const started = Date.now();
    const consoleLogs: string[] = [];
    let isolate: ivm.Isolate | null = null;
    let context: ivm.Context | null = null;

    try {
      // 1. Transpile TS → JS
      const esbuild = await import('esbuild');
      const transformResult = await esbuild.transform(code, {
        loader: 'ts',
        target: 'node18',
        format: 'cjs',
      });
      const jsCode = transformResult.code;

      // 2. Initialize sandboxed V8 Isolate
      isolate = new ivm.Isolate({ memoryLimit: 128 });
      context = isolate.createContextSync();
      const jail = context.global;

      jail.setSync('global', jail.derefInto());

      // 3. Console bridge
      const logCallback = function (...logs: string[]) {
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

        delete global.eval;
      `;

      // 4. Compose: console bridge → test harness → user code → test code → collect
      const fullScript = `
        ${consoleBridge}
        ${TEST_HARNESS_CODE}

        // ── User code ──
        ${jsCode}

        // Make user exports available as globals for test code
        if (typeof module.exports === 'function') {
          global[module.exports.name || 'solve'] = module.exports;
        } else if (typeof module.exports === 'object' && module.exports !== null) {
          for (const [k, v] of Object.entries(module.exports)) {
            if (k !== '__esModule') global[k] = v;
          }
        }
        if (typeof exports === 'object' && exports !== null) {
          for (const [k, v] of Object.entries(exports)) {
            if (k !== '__esModule') global[k] = v;
          }
        }
        // Top-level function declarations (e.g. function twoSum() {})
        // are already in global scope via the script evaluation.

        // ── Test code ──
        ${testCode}

        // ── Collect results ──
        ${TEST_COLLECT_CODE}
      `;

      const script = isolate.compileScriptSync(fullScript);

      // 5. Execute with timeout
      const jsonOutput = script.runSync(context, { timeout: 5000 }) as string;
      const parsed = JSON.parse(jsonOutput);

      context.release();
      isolate.dispose();
      isolate = null;
      context = null;

      const results = (parsed.results || []) as { name: string; passed: boolean; error?: string }[];
      const allPassed = results.length > 0 && results.every((r) => r.passed);

      return {
        passed: allPassed,
        results,
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

      const msg =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : JSON.stringify(error);

      return {
        passed: false,
        results: [{ name: 'Execution Error', passed: false, error: msg }],
        runtimeMs: Date.now() - started,
        logs: consoleLogs,
      };
    }
  }
}
