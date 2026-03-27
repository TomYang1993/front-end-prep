'use client';

import { useMemo, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Sandpack } from '@codesandbox/sandpack-react';
import { useToast } from '@/components/toast-provider';
import { RunResult, SpecificPlaygroundProps } from './shared';

export function ReactPlayground({ questionId, starterCode, publicTests }: SpecificPlaygroundProps) {
  const { toast } = useToast();

  const initialCode = starterCode?.react || "import React from 'react';\n\nexport default function App() {\n  return <div>Start building your component.</div>;\n}";
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

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'REACT_TEST_RESULTS') {
        const res = e.data.results as RunResult[];
        const passedCount = res.filter(r => r.passed).length;
        setSummary({ passedCount, total: res.length });
        setResults(res);
        setRunning(false);
        toast({
          title: passedCount === res.length ? 'All public tests passed!' : `Passed ${passedCount}/${res.length} tests`,
          type: passedCount === res.length ? 'success' : 'info',
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast]);

  const sandpackFiles = useMemo(() => {
    return {
      '/App.tsx': `
import React, { useEffect, useRef } from 'react';
import UserComponent from './UserCode';

const tests = ${JSON.stringify(publicTests)};

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'RUN_REACT_TESTS') {
         const container = containerRef.current;
         if (!container) return;

         const results = tests.map(t => {
            const exp = typeof t.expected === 'string' ? JSON.parse(t.expected) : (t.expected || {});
            const errors: string[] = [];
            const textContent = container.textContent || '';
            const rootHtml = container.innerHTML;

            if (exp.containsText) {
              for (const text of exp.containsText) {
                if (!textContent.includes(text)) errors.push('Missing text: ' + text);
              }
            }
            if (exp.querySelector) {
              if (!container.querySelector(exp.querySelector)) errors.push('Missing element: ' + exp.querySelector);
            }
            if (exp.querySelectorAll) {
               const found = container.querySelectorAll(exp.querySelectorAll.selector);
               if (found.length !== exp.querySelectorAll.count) errors.push('Expected ' + exp.querySelectorAll.count + ' elements');
            }
            if (exp.containsTag) {
               if (container.getElementsByTagName(exp.containsTag).length === 0) errors.push('Missing tag: ' + exp.containsTag);
            }
            
            const passed = errors.length === 0;
            return {
               id: t.id,
               passed,
               output: rootHtml.slice(0, 100),
               runtimeMs: 10,
               error: passed ? undefined : errors.join(', ')
            };
         });
         
         window.parent.postMessage({ type: 'REACT_TEST_RESULTS', results }, '*');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return <div ref={containerRef}><UserComponent /></div>;
}
`,
      '/UserCode.tsx': code,
    };
  }, [code, publicTests]);

  async function runPublicTests() {
    setRunning(true);
    setHiddenSummary(null);
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      iframe.contentWindow?.postMessage({ type: 'RUN_REACT_TESTS' }, '*');
    });
  }

  async function submitHiddenTests() {
    setSubmitting(true);
    try {
      const response = await fetch('/api/submissions/judge-hidden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, framework: 'react', code, publicResult: { summary, results } }),
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
          <h3>React Playground</h3>
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
      <div className="react-preview-grid">
        <div className="editor-shell">
          <Editor
            height="400px" defaultLanguage="typescript" theme="vs-dark" value={code}
            onChange={(v) => setCode(v || '')}
            options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 12 } }}
          />
        </div>
        <div className="preview-shell">
          <Sandpack
            template="react-ts"
            files={sandpackFiles}
            options={{ editorHeight: 400, showLineNumbers: true, showTabs: false }}
          />
        </div>
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
