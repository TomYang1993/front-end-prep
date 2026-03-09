'use client';

import { useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Sandpack } from '@codesandbox/sandpack-react';
import { useToast } from '@/components/toast-provider';

interface PublicTest {
  id: string;
  input: unknown;
  expected: unknown;
  explanation?: string | null;
}

interface PlaygroundProps {
  questionId: string;
  type: 'FUNCTION_JS' | 'REACT_APP';
  starterCode?: Record<string, string>;
  publicTests: PublicTest[];
}

interface RunResult {
  id: string;
  passed: boolean;
  output: unknown;
  runtimeMs: number;
  error?: string;
  explanation?: string | null;
}

export function ProblemPlayground({ questionId, type, starterCode, publicTests }: PlaygroundProps) {
  const { toast } = useToast();

  const initialCode = useMemo(() => {
    if (type === 'REACT_APP') {
      return (
        starterCode?.react ||
        "import React from 'react';\n\nexport default function App() {\n  return <div>Start building your component.</div>;\n}"
      );
    }

    return starterCode?.javascript || 'function solve(...args) {\n  return null;\n}';
  }, [type, starterCode]);

  const [code, setCode] = useState(initialCode);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<RunResult[]>([]);
  const [summary, setSummary] = useState<{ passedCount: number; total: number } | null>(null);
  const [hiddenSummary, setHiddenSummary] = useState<{
    score: number;
    status: string;
    passedCount: number;
    total: number;
  } | null>(null);
  const framework = type === 'REACT_APP' ? 'react' : 'javascript';
  const displayResults: RunResult[] =
    results.length > 0
      ? results
      : publicTests.map((test) => ({
        id: test.id,
        passed: false,
        output: null,
        runtimeMs: 0,
        error: undefined,
        explanation: test.explanation,
      }));

  async function runPublicTests() {
    setRunning(true);
    setHiddenSummary(null);

    try {
      const response = await fetch('/api/playground/run-public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId, framework, code }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Public test run failed');
      }

      setSummary(data.summary || null);
      setResults(data.results || []);

      const passed = data.summary?.passedCount || 0;
      const total = data.summary?.total || 0;
      toast({
        title: passed === total ? 'All public tests passed!' : `Passed ${passed}/${total} tests`,
        type: passed === total ? 'success' : 'info',
      });
    } catch (error) {
      setSummary(null);
      setResults([
        {
          id: 'runtime-error',
          passed: false,
          output: null,
          runtimeMs: 0,
          error: error instanceof Error ? error.message : 'Unknown runtime error',
        },
      ]);
      toast({
        title: 'Test run failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      });
    } finally {
      setRunning(false);
    }
  }

  async function submitHiddenTests() {
    setSubmitting(true);

    try {
      const response = await fetch('/api/submissions/judge-hidden', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          framework,
          code,
          publicResult: { summary, results },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Hidden judge failed');
      }

      setHiddenSummary({
        score: data.score,
        status: data.status,
        passedCount: data.passedCount,
        total: data.total,
      });

      toast({
        title: data.status === 'PASSED' ? 'All hidden tests passed!' : `Score: ${data.score}%`,
        description: `${data.passedCount}/${data.total} hidden tests passed`,
        type: data.status === 'PASSED' ? 'success' : 'info',
      });
    } catch (error) {
      setHiddenSummary({
        score: 0,
        status: 'ERROR',
        passedCount: 0,
        total: 0,
      });
      toast({
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="playground-block">
      <div className="playground-toolbar">
        <div>
          <h3>Playground</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
            Run public tests instantly, then submit hidden judge.
          </p>
        </div>
        <div className="toolbar-buttons">
          <button disabled={running} onClick={runPublicTests} className="btn btn-secondary" type="button">
            {running ? 'Running…' : '▶ Run tests'}
          </button>
          <button disabled={submitting} onClick={submitHiddenTests} className="btn" type="button">
            {submitting ? 'Judging…' : '⬆ Submit'}
          </button>
        </div>
      </div>

      {type === 'REACT_APP' ? (
        <div className="react-preview-grid">
          <div className="editor-shell">
            <Editor
              height="400px"
              defaultLanguage="typescript"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 12 } }}
            />
          </div>
          <div className="preview-shell">
            <Sandpack
              template="react-ts"
              files={{
                '/App.tsx': code,
              }}
              options={{
                editorHeight: 400,
                showLineNumbers: true,
                showTabs: false,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="editor-shell">
          <Editor
            height="400px"
            defaultLanguage="javascript"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 12 } }}
          />
        </div>
      )}

      <section className="results-block">
        <h4>Public tests</h4>
        {summary ? (
          <p className="summary-line">
            Passed {summary.passedCount}/{summary.total}
          </p>
        ) : (
          <p className="summary-line">No run yet.</p>
        )}
        <ul>
          {displayResults.map((result) => (
            <li key={result.id} className={result.passed ? 'result pass' : 'result fail'}>
              <span>{result.id}</span>
              <span style={{ fontWeight: 600 }}>{result.passed ? '✓ PASS' : '✗ FAIL'}</span>
              <span style={{ color: 'var(--muted)' }}>{result.runtimeMs}ms</span>
              {result.error ? <p className="error-text">{result.error}</p> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="results-block">
        <h4>Hidden judge</h4>
        {hiddenSummary ? (
          <p className="summary-line">
            <strong>{hiddenSummary.status}</strong> | score {hiddenSummary.score}% | passed{' '}
            {hiddenSummary.passedCount}/{hiddenSummary.total}
          </p>
        ) : (
          <p className="summary-line">No hidden submission yet.</p>
        )}
      </section>
    </section>
  );
}
