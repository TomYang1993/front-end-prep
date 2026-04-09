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
        const worker = workerRef.current;
        if (!worker) return reject(new Error('Python runtime not initialized'));

        const results: PythonRunResult[] = [];
        let remaining = tests.length;

        const handler = (e: MessageEvent) => {
          if (e.data.type !== 'RESULT') return;

          const test = tests.find((t) => t.id === e.data.testId);
          const passed =
            JSON.stringify(e.data.output) === JSON.stringify(test?.expected);

          results.push({
            id: e.data.testId,
            passed,
            output: e.data.output,
            runtimeMs: e.data.runtimeMs,
            error: e.data.error,
            logs: e.data.logs || [],
          });

          remaining--;
          if (remaining <= 0) {
            worker.removeEventListener('message', handler);
            const ordered = tests.map(
              (t) => results.find((r) => r.id === t.id)!
            );
            resolve(ordered);
          }
        };

        worker.addEventListener('message', handler);

        for (const test of tests) {
          const args = (test.input as { args?: unknown[] })?.args || [];
          worker.postMessage({ type: 'RUN', code, args, testId: test.id });
        }

        // Timeout after 30s
        setTimeout(() => {
          worker.removeEventListener('message', handler);
          reject(new Error('Python execution timed out (30s)'));
        }, 30000);
      });
    },
    []
  );

  return { ready, loading, runTests };
}
