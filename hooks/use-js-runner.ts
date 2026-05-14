'use client';

import { useCallback, useEffect, useRef } from 'react';

export interface JsTestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface JsRunResult {
  passed: boolean;
  results: JsTestResult[];
  logs: string[];
  runtimeMs: number;
}

const TIMEOUT_MS = 10_000;

interface UseJsRunnerReturn {
  runTests: (
    userCode: string,
    testCode: string,
    language: 'javascript' | 'typescript',
  ) => Promise<JsRunResult>;
}

/**
 * Client-side JS/TS test runner.
 *
 * Spawns a fresh Web Worker per run, terminates on timeout or completion.
 * The worker bundles sucrase for TS → JS transpile, our test harness, and
 * runs user code + test code inside its own scope. No event-loop polyfill
 * needed — Workers have real timers and microtasks.
 */
export function useJsRunner(): UseJsRunnerReturn {
  const activeWorkerRef = useRef<Worker | null>(null);

  // Terminate any in-flight worker on unmount.
  useEffect(() => {
    return () => {
      activeWorkerRef.current?.terminate();
      activeWorkerRef.current = null;
    };
  }, []);

  const runTests = useCallback(
    (userCode: string, testCode: string, language: 'javascript' | 'typescript') => {
      return new Promise<JsRunResult>((resolve) => {
        activeWorkerRef.current?.terminate();

        const worker = new Worker(
          new URL('@/lib/runners/client/js-test-worker.ts', import.meta.url),
        );
        activeWorkerRef.current = worker;

        const cleanup = () => {
          worker.terminate();
          if (activeWorkerRef.current === worker) {
            activeWorkerRef.current = null;
          }
          clearTimeout(timeoutId);
        };

        const timeoutId = setTimeout(() => {
          cleanup();
          resolve({
            passed: false,
            results: [
              {
                name: 'Execution Error',
                passed: false,
                error: `Execution timed out after ${TIMEOUT_MS / 1000}s — possible infinite loop`,
              },
            ],
            logs: [],
            runtimeMs: TIMEOUT_MS,
          });
        }, TIMEOUT_MS);

        worker.onmessage = (e: MessageEvent) => {
          if (e.data?.type === 'RESULT') {
            cleanup();
            resolve({
              passed: e.data.passed,
              results: e.data.results,
              logs: e.data.logs,
              runtimeMs: e.data.runtimeMs,
            });
          } else if (e.data?.type === 'ERROR') {
            cleanup();
            resolve({
              passed: false,
              results: [{ name: 'Execution Error', passed: false, error: e.data.error }],
              logs: [],
              runtimeMs: 0,
            });
          }
        };

        worker.onerror = (err) => {
          cleanup();
          resolve({
            passed: false,
            results: [
              { name: 'Execution Error', passed: false, error: err.message || 'Worker error' },
            ],
            logs: [],
            runtimeMs: 0,
          });
        };

        worker.postMessage({ type: 'RUN', userCode, testCode, language });
      });
    },
    [],
  );

  return { runTests };
}
