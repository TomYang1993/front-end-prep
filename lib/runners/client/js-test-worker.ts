/// <reference lib="webworker" />
import { transform } from 'sucrase';
import {
  TEST_HARNESS_CODE,
  TEST_COLLECT_ASYNC_CODE,
} from '@/lib/runners/test-harness';

declare const self: DedicatedWorkerGlobalScope;

interface RunMessage {
  type: 'RUN';
  userCode: string;
  testCode: string;
  language: 'javascript' | 'typescript';
}

interface ResultMessage {
  type: 'RESULT';
  passed: boolean;
  results: { name: string; passed: boolean; error?: string }[];
  logs: string[];
  runtimeMs: number;
}

interface ErrorMessage {
  type: 'ERROR';
  error: string;
}

function transpile(code: string, language: 'javascript' | 'typescript'): string {
  if (language === 'javascript') return code;
  return transform(code, {
    transforms: ['typescript'],
    disableESTransforms: true,
  }).code;
}

self.onmessage = async (e: MessageEvent<RunMessage>) => {
  const { type, userCode, testCode, language } = e.data;
  if (type !== 'RUN') return;

  const started = performance.now();
  const consoleLogs: string[] = [];

  try {
    const jsUserCode = transpile(userCode, language);

    const fullScript = `
      ${TEST_HARNESS_CODE}

      // ── User code ──
      ${jsUserCode}

      // ── Test code ──
      ${testCode}

      // ── Collect (async) ──
      return ${TEST_COLLECT_ASYNC_CODE};
    `;

    // Capture console.log inside the test sandbox.
    // We use a fresh Function so user code runs in a function scope, not module scope.
    const fakeConsole = {
      log: (...args: unknown[]) => consoleLogs.push(args.map(formatArg).join(' ')),
      error: (...args: unknown[]) => consoleLogs.push(args.map(formatArg).join(' ')),
      warn: (...args: unknown[]) => consoleLogs.push(args.map(formatArg).join(' ')),
      info: (...args: unknown[]) => consoleLogs.push(args.map(formatArg).join(' ')),
    };

    const runner = new Function('console', fullScript);
    const jsonOutput = (await runner(fakeConsole)) as string;
    const parsed = JSON.parse(jsonOutput) as {
      results: { name: string; passed: boolean; error?: string }[];
    };

    const allPassed =
      parsed.results.length > 0 && parsed.results.every((r) => r.passed);

    const result: ResultMessage = {
      type: 'RESULT',
      passed: allPassed,
      results: parsed.results,
      logs: consoleLogs,
      runtimeMs: Math.round(performance.now() - started),
    };
    self.postMessage(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const error: ErrorMessage = { type: 'ERROR', error: msg };
    self.postMessage(error);
  }
};

function formatArg(a: unknown): string {
  if (typeof a === 'string') return a;
  try {
    return JSON.stringify(a);
  } catch {
    return String(a);
  }
}
