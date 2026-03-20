'use client';

import { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useToast } from '@/components/toast-provider';
import { 
  Code2, Lightbulb, History, HelpCircle, FileCode2, 
  Settings, TerminalSquare, ClipboardList, Play, Upload
} from 'lucide-react';

interface PublicTest {
  id: string;
  input: unknown;
  expected: unknown;
  explanation?: string | null;
}

interface SolutionView {
  id: string;
  language: string;
  framework: string | null;
  explanation: string;
  code: string;
  complexity: string | null;
}

interface EditorWorkspaceProps {
  questionId: string;
  title: string;
  prompt: string;
  difficulty: string;
  tags: string[];
  starterCode?: Record<string, string>;
  publicTests: PublicTest[];
  solutions: SolutionView[];
}

interface RunResult {
  id: string;
  passed: boolean;
  output: unknown;
  runtimeMs: number;
  error?: string;
  explanation?: string | null;
}

type SideTab = 'code' | 'solutions' | 'history';
type LeftTab = 'description' | 'solutions';
type BottomTab = 'console' | 'testcases';

export function EditorWorkspace({
  questionId,
  title,
  prompt,
  difficulty,
  tags,
  starterCode,
  publicTests,
  solutions,
}: EditorWorkspaceProps) {
  const { toast } = useToast();

  const initialCode = useMemo(
    () => starterCode?.javascript || 'function solve(...args) {\n  return null;\n}',
    [starterCode]
  );

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
  const [consoleLog, setConsoleLog] = useState<string[]>([]);

  const [activeSideTab, setActiveSideTab] = useState<SideTab>('code');
  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>('description');
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('console');
  const [monacoTheme, setMonacoTheme] = useState<'vs-dark' | 'light'>('vs-dark');

  useEffect(() => {
    // Sync Monaco theme with global app theme
    const updateTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setMonacoTheme(theme === 'light' ? 'light' : 'vs-dark');
    };

    updateTheme(); // initial check
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.attributeName === 'data-theme') {
          updateTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  async function runPublicTests() {
    setRunning(true);
    setHiddenSummary(null);
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    setConsoleLog((prev) => [...prev, `[${now}] # Executing public tests...`]);

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
      const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
      setConsoleLog((prev) => [
        ...prev,
        `[${ts}] Passed ${passed}/${total} tests`,
        ...(data.results || []).map((r: RunResult) =>
          `[${ts}] Case ${r.id}: ${r.passed ? 'Accepted' : 'Failed'} (${r.runtimeMs}ms)`
        ),
      ]);

      toast({
        title: passed === total ? 'All public tests passed!' : `Passed ${passed}/${total} tests`,
        type: passed === total ? 'success' : 'info',
      });
    } catch (error) {
      const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setConsoleLog((prev) => [...prev, `[${ts}] ERROR: ${msg}`]);
      setResults([{ id: 'runtime-error', passed: false, output: null, runtimeMs: 0, error: msg }]);
      toast({ title: 'Test run failed', description: msg, type: 'error' });
    } finally {
      setRunning(false);
    }
  }

  async function submitHiddenTests() {
    setSubmitting(true);
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    setConsoleLog((prev) => [...prev, `[${ts}] # Submitting for hidden judge...`]);

    try {
      const response = await fetch('/api/submissions/judge-hidden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, framework: 'javascript', code, publicResult: { summary, results } }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Hidden judge failed');

      setHiddenSummary({ score: data.score, status: data.status, passedCount: data.passedCount, total: data.total });

      const ts2 = new Date().toLocaleTimeString('en-US', { hour12: false });
      setConsoleLog((prev) => [
        ...prev,
        `[${ts2}] Judge: ${data.status} | Score: ${data.score}% | ${data.passedCount}/${data.total}`,
      ]);

      toast({
        title: data.status === 'PASSED' ? 'All hidden tests passed!' : `Score: ${data.score}%`,
        description: `${data.passedCount}/${data.total} hidden tests passed`,
        type: data.status === 'PASSED' ? 'success' : 'info',
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setConsoleLog((prev) => [...prev, `[${ts}] ERROR: ${msg}`]);
      setHiddenSummary({ score: 0, status: 'ERROR', passedCount: 0, total: 0 });
      toast({ title: 'Submission failed', description: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  const diffClass = difficulty.toLowerCase();

  return (
    <div className="ide-workspace">
      {/* ─── Side Nav ─── */}
      <aside className="ide-sidenav">
        <div className="ide-sidenav-top">
          <button
            className={`ide-sidenav-btn ${activeSideTab === 'code' ? 'active' : ''}`}
            onClick={() => setActiveSideTab('code')}
            title="Code"
          ><Code2 size={24} strokeWidth={1.5} /></button>
          <button
            className={`ide-sidenav-btn ${activeSideTab === 'solutions' ? 'active' : ''}`}
            onClick={() => setActiveSideTab('solutions')}
            title="Solutions"
          ><Lightbulb size={24} strokeWidth={1.5} /></button>
          <button
            className={`ide-sidenav-btn ${activeSideTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveSideTab('history')}
            title="History"
          ><History size={24} strokeWidth={1.5} /></button>
        </div>
        <div className="ide-sidenav-bottom">
          <button className="ide-sidenav-btn" title="Help"><HelpCircle size={24} strokeWidth={1.5} /></button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="ide-content">
        {/* Left Pane: Problem Description */}
        <section className="ide-left-pane">
          {/* Sub header / tabs */}
          <div className="ide-left-header">
            <div className="ide-left-title-row">
              <h1 className="ide-problem-title">{title}</h1>
              <span className={`diff-badge ${diffClass}`}>{difficulty}</span>
            </div>
            <div className="ide-left-tabs">
              <button
                className={`ide-left-tab ${activeLeftTab === 'description' ? 'active' : ''}`}
                onClick={() => setActiveLeftTab('description')}
              >Description</button>
              <button
                className={`ide-left-tab ${activeLeftTab === 'solutions' ? 'active' : ''}`}
                onClick={() => setActiveLeftTab('solutions')}
              ><Lightbulb size={16} className="inline-block mr-1" /> Solutions</button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="ide-left-body">
            {activeLeftTab === 'description' ? (
              <>
                <div className="ide-tag-row">
                  {tags.map((tag) => (
                    <span key={tag} className="ide-tag">{tag}</span>
                  ))}
                </div>

                <div className="ide-description">
                  <p>{prompt}</p>
                </div>

                {/* Examples from public tests */}
                {publicTests.map((test, i) => (
                  <div key={test.id} className="ide-example">
                    <h3 className="ide-example-heading">Example {i + 1}:</h3>
                    <div className="ide-example-block">
                      <div><span className="ide-example-label">Input:</span> {JSON.stringify((test.input as { args?: unknown[] })?.args)}</div>
                      <div><span className="ide-example-label">Output:</span> {JSON.stringify(test.expected)}</div>
                      {test.explanation && (
                        <div className="ide-example-explanation">{test.explanation}</div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="ide-solutions-list">
                {solutions.length === 0 ? (
                  <p className="ide-empty-state">No official solutions published yet.</p>
                ) : (
                  solutions.map((sol) => (
                    <article key={sol.id} className="ide-solution-card">
                      <div className="ide-solution-meta">
                        <span>{sol.language}</span>
                        {sol.complexity && <span>{sol.complexity}</span>}
                      </div>
                      <p>{sol.explanation}</p>
                      <pre className="ide-solution-code"><code>{sol.code}</code></pre>
                    </article>
                  ))
                )}
              </div>
            )}
          </div>
        </section>

        {/* Right Pane: Editor + Console */}
        <section className="ide-right-pane">
          {/* Editor toolbar */}
          <div className="ide-editor-toolbar">
            <div className="ide-editor-tab-bar">
              <span className="ide-file-tab active"><FileCode2 size={16} className="inline-block mr-1" /> Solution.js</span>
              <span className="ide-lang-label">JavaScript</span>
            </div>
            <div className="ide-editor-actions">
              <button className="ide-toolbar-btn" title="Settings"><Settings size={16} /></button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="ide-editor-body">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme={monacoTheme}
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                padding: { top: 12 },
                lineNumbersMinChars: 3,
                scrollBeyondLastLine: false,
                renderLineHighlight: 'gutter',
                fontFamily: 'var(--font-mono), JetBrains Mono, monospace',
              }}
            />
          </div>

          {/* Console / Test Cases Panel */}
          <div className="ide-console">
            <div className="ide-console-tabs">
              <button
                className={`ide-console-tab ${activeBottomTab === 'console' ? 'active' : ''}`}
                onClick={() => setActiveBottomTab('console')}
              ><TerminalSquare size={16} className="inline-block mr-1" /> Console</button>
              <button
                className={`ide-console-tab ${activeBottomTab === 'testcases' ? 'active' : ''}`}
                onClick={() => setActiveBottomTab('testcases')}
              ><ClipboardList size={16} className="inline-block mr-1" /> Test Cases</button>
            </div>

            <div className="ide-console-body">
              {activeBottomTab === 'console' ? (
                <div className="ide-console-log">
                  {consoleLog.length === 0 ? (
                    <span className="ide-console-empty">Run or submit to see output here.</span>
                  ) : (
                    consoleLog.map((line, i) => (
                      <div key={i} className={`ide-console-line ${line.includes('ERROR') ? 'error' : line.includes('#') ? 'comment' : ''}`}>
                        {line}
                      </div>
                    ))
                  )}

                  {/* Show result badges */}
                  {results.length > 0 && (
                    <div className="ide-console-results">
                      {results.map((r) => (
                        <div key={r.id} className={`ide-result-badge ${r.passed ? 'pass' : 'fail'}`}>
                          Case {r.id}: {r.passed ? 'Accepted' : 'Failed'} {r.output !== null ? `(${JSON.stringify(r.output)})` : ''}
                        </div>
                      ))}
                    </div>
                  )}

                  {hiddenSummary && (
                    <div className={`ide-result-badge ${hiddenSummary.status === 'PASSED' ? 'pass' : 'fail'}`} style={{ marginTop: '0.5rem' }}>
                      Judge: {hiddenSummary.status} | Score: {hiddenSummary.score}% | {hiddenSummary.passedCount}/{hiddenSummary.total}
                    </div>
                  )}
                </div>
              ) : (
                <div className="ide-testcases">
                  {publicTests.map((test, i) => (
                    <div key={test.id} className="ide-testcase">
                      <span className="ide-testcase-label">Case {i + 1}</span>
                      <div className="ide-testcase-data">
                        <span>Input: {JSON.stringify((test.input as { args?: unknown[] })?.args)}</span>
                        <span>Expected: {JSON.stringify(test.expected)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ─── Bottom Bar ─── */}
      <footer className="ide-bottombar">
        <div className="ide-bottombar-left">
          <button className="ide-bottombar-btn" onClick={() => setActiveBottomTab('console')}>
            <TerminalSquare size={16} className="inline-block mr-1" /> Console
          </button>
          <button className="ide-bottombar-btn" onClick={() => setActiveBottomTab('testcases')}>
            <ClipboardList size={16} className="inline-block mr-1" /> Test Cases
          </button>
        </div>
        <div className="ide-bottombar-right">
          <button
            className="ide-run-btn flex items-center gap-2"
            disabled={running}
            onClick={runPublicTests}
          >
            <Play size={16} fill="currentColor" /> {running ? 'Running…' : 'Run Code'}
          </button>
          <button
            className="ide-submit-btn flex items-center gap-2"
            disabled={submitting}
            onClick={submitHiddenTests}
          >
            <Upload size={16} /> {submitting ? 'Judging…' : 'Submit'}
          </button>
        </div>
      </footer>
    </div>
  );
}
