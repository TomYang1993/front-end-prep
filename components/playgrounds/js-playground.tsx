'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useToast } from '@/components/toast-provider';
import { RunResult, SpecificPlaygroundProps } from './shared';

export function JsPlayground({ questionId, starterCode, publicTests }: SpecificPlaygroundProps) {
  const { toast } = useToast();

  const initialCode = starterCode?.javascript || 'export default function solve(...args) {\n  return null;\n}';
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

  const displayResults: RunResult[] = results.length > 0 ? results : publicTests.map((t) => ({
    id: t.id, passed: false, output: null, runtimeMs: 0, explanation: t.explanation
  }));

  async function runPublicTests() {
    setRunning(true);
    setHiddenSummary(null);

    try {
      const response = await fetch('/api/playground/run-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, framework: 'javascript', code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Public test run failed');

      setSummary(data.summary || null);
      setResults(data.results || []);

      const passed = data.summary?.passedCount || 0;
      const total = data.summary?.total || 0;
      toast({
        title: passed === total ? 'All public tests passed!' : `Passed ${passed}/${total} tests`,
        type: passed === total ? 'success' : 'info'
      });
    } catch (error) {
      setSummary(null);
      setResults([{
        id: 'runtime-error', passed: false, output: null, runtimeMs: 0,
        error: error instanceof Error ? error.message : 'Unknown runtime error'
      }]);
      toast({ title: 'Test run failed', description: error instanceof Error ? error.message : 'Unknown error', type: 'error' });
    } finally {
      setRunning(false);
    }
  }

  async function submitHiddenTests() {
    setSubmitting(true);
    try {
      const response = await fetch('/api/submissions/judge-hidden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, framework: 'javascript', code, publicResult: { summary, results } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Hidden judge failed');

      setHiddenSummary({ score: data.score, status: data.status, passedCount: data.passedCount, total: data.total });
      toast({
        title: data.status === 'PASSED' ? 'All hidden tests passed!' : `Score: ${data.score}%`,
        description: `${data.passedCount}/${data.total} hidden tests passed`,
        type: data.status === 'PASSED' ? 'success' : 'info'
      });
    } catch (error) {
      setHiddenSummary({ score: 0, status: 'ERROR', passedCount: 0, total: 0 });
      toast({ title: 'Submission failed', description: error instanceof Error ? error.message : 'Unknown error', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="playground-block">
      <div className="playground-toolbar">
        <div>
          <h3>JS Playground</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Run public tests instantly, then submit hidden judge.</p>
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
      <div className="editor-shell">
        <Editor
          height="400px" defaultLanguage="javascript" theme="vs-dark" value={code}
          onChange={(v) => setCode(v || '')}
          options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 12 } }}
        />
      </div>
      <section className="results-block">
        <h4>Public tests</h4>
        {summary ? <p className="summary-line">Passed {summary.passedCount}/{summary.total}</p> : <p className="summary-line">No run yet.</p>}
        <ul>
          {displayResults.map((r) => (
            <li key={r.id} className={r.passed ? 'result pass' : 'result fail'}>
              <span>{r.id}</span>
              <span style={{ fontWeight: 600 }}>{r.passed ? '✓ PASS' : '✗ FAIL'}</span>
              <span style={{ color: 'var(--muted)' }}>{r.runtimeMs}ms</span>
              {r.error && <p className="error-text">{r.error}</p>}
            </li>
          ))}
        </ul>
      </section>
      <section className="results-block">
        <h4>Hidden judge</h4>
        {hiddenSummary ? (
          <p className="summary-line">
            <strong>{hiddenSummary.status}</strong> | score {hiddenSummary.score}% | passed {hiddenSummary.passedCount}/{hiddenSummary.total}
          </p>
        ) : <p className="summary-line">No hidden submission yet.</p>}
      </section>
    </section>
  );
}
