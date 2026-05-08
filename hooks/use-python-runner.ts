'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface PythonRunResult {
  id: string;
  passed: boolean;
  output: unknown;
  runtimeMs: number;
  error?: string;
  logs: string[];
}

interface UsePythonRunnerReturn {
  ready: boolean;
  loading: boolean;
  runTests: (
    code: string,
    tests: { id: string; input: unknown; expected: unknown }[]
  ) => Promise<PythonRunResult[]>;
}

export function usePythonRunner(enabled: boolean): UsePythonRunnerReturn {
  const workerRef = useRef<Worker | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: kick off Pyodide init
    setLoading(true);
    const worker = new Worker('/pyodide-worker.js');
    workerRef.current = worker;

    worker.postMessage({ type: 'INIT' });

    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'READY') {
        setReady(true);
        setLoading(false);
      }
      if (e.data.type === 'INIT_ERROR') {
        setLoading(false);
        console.error('Pyodide init failed:', e.data.error);
      }
    };

    worker.addEventListener('message', handleMessage);

    return () => {
      worker.removeEventListener('message', handleMessage);
      worker.terminate();
      workerRef.current = null;
      setReady(false);
      setLoading(false);
    };
  }, [enabled]);

  const runTests = useCallback(
    (
      code: string,
      tests: { id: string; input: unknown; expected: unknown }[]
    ): Promise<PythonRunResult[]> => {
      return new Promise((resolve, reject) => {
        if (tests.length === 0) return resolve([]);

        const worker = workerRef.current;
        if (!worker) return reject(new Error('Python runtime not initialized'));

        const results = new Array<PythonRunResult>(tests.length);
        const indexById = new Map(tests.map((t, i) => [t.id, i]));
        let remaining = tests.length;
        // eslint-disable-next-line prefer-const
        let timeoutId: ReturnType<typeof setTimeout>;

        const cleanup = () => {
          worker.removeEventListener('message', handler);
          clearTimeout(timeoutId);
        };

        const handler = (e: MessageEvent) => {
          if (e.data.type !== 'RESULT') return;

          const idx = indexById.get(e.data.testId);
          if (idx === undefined) return;

          const passed =
            JSON.stringify(e.data.output) === JSON.stringify(tests[idx].expected);

          results[idx] = {
            id: e.data.testId,
            passed,
            output: e.data.output,
            runtimeMs: e.data.runtimeMs,
            error: e.data.error,
            logs: e.data.logs || [],
          };

          if (--remaining <= 0) {
            cleanup();
            resolve(results);
          }
        };

        worker.addEventListener('message', handler);

        for (const test of tests) {
          const args = (test.input as { args?: unknown[] })?.args || [];
          worker.postMessage({ type: 'RUN', code, args, testId: test.id });
        }

        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error('Python execution timed out (30s)'));
        }, 30000);
      });
    },
    []
  );

  return { ready, loading, runTests };
}
