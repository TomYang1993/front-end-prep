'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import { SandpackProvider, SandpackPreview } from '@codesandbox/sandpack-react';
import { useToast } from '@/components/toast-provider';
import {
  Code2, Lightbulb, HelpCircle, FileCode2,
  TerminalSquare, ClipboardList, Play, Upload,
  ArrowLeft, Eye, Palette
} from 'lucide-react';
import { CheatsheetModal } from '@/components/cheatsheet-modal';

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

interface ReactEditorWorkspaceProps {
  questionId: string;
  title: string;
  prompt: string;
  difficulty: string;
  tags: string[];
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

type ActiveFile = 'app' | 'styles';
type LeftTab = 'description' | 'solutions';
type BottomTab = 'console' | 'testcases' | 'preview';

const DEFAULT_APP_CODE = `import React from 'react';

export default function App() {
  return <div>Start building your component.</div>;
}`;

const DEFAULT_CSS = `/* Write your component styles here */
`;

export function ReactEditorWorkspace({
  questionId,
  title,
  prompt,
  difficulty,
  tags,
  starterCode,
  publicTests,
}: ReactEditorWorkspaceProps) {
  const { toast } = useToast();
  const [solutions, setSolutions] = useState<SolutionView[]>([]);
  const [loadingSolutions, setLoadingSolutions] = useState(false);

  const [activeFile, setActiveFile] = useState<ActiveFile>('app');
  const [codes, setCodes] = useState({
    app: starterCode?.react || DEFAULT_APP_CODE,
    styles: starterCode?.css || DEFAULT_CSS,
  });

  const code = codes[activeFile];
  const setCode = (val: string) => setCodes((prev) => ({ ...prev, [activeFile]: val }));

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

  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>('description');
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('preview');
  const [monacoTheme, setMonacoTheme] = useState<'vs-dark' | 'light'>('vs-dark');

  // Lazy-load solutions
  useEffect(() => {
    if (activeLeftTab === 'solutions' && solutions.length === 0 && !loadingSolutions) {
      setLoadingSolutions(true);
      fetch(`/api/questions/${questionId}/solutions`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setSolutions(data); })
        .finally(() => setLoadingSolutions(false));
    }
  }, [activeLeftTab, questionId, solutions.length, loadingSolutions]);

  // Resizable left pane
  const [leftWidth, setLeftWidth] = useState(450);
  const isDragging = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = Math.max(300, Math.min(e.clientX - 65, window.innerWidth * 0.7));
      setLeftWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = () => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
  };

  // Theme sync + lock scroll
  useEffect(() => {
    const updateTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setMonacoTheme(theme === 'light' ? 'light' : 'vs-dark');
    };
    updateTheme();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.attributeName === 'data-theme') updateTheme();
      });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    document.body.style.overflow = 'hidden';
    return () => {
      observer.disconnect();
      document.body.style.overflow = '';
    };
  }, []);

  // Listen for test results from Sandpack iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'REACT_TEST_RESULTS') {
        const res = e.data.results as RunResult[];
        const passedCount = res.filter(r => r.passed).length;
        setSummary({ passedCount, total: res.length });
        setResults(res);
        setRunning(false);

        const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
        const newLogs = [`[${ts}] Passed ${passedCount}/${res.length} tests`];
        res.forEach((r) => {
          newLogs.push(`[${ts}] Case ${r.id}: ${r.passed ? 'Accepted' : 'Failed'}`);
          if (r.error) newLogs.push(`> [ERROR] ${r.error}`);
        });
        setConsoleLog((prev) => [...prev, ...newLogs]);

        toast({
          title: passedCount === res.length ? 'All public tests passed!' : `Passed ${passedCount}/${res.length} tests`,
          type: passedCount === res.length ? 'success' : 'info',
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast]);

  // Build Sandpack files (test harness + user code + user styles)
  const sandpackFiles = useMemo(() => ({
    '/App.tsx': buildTestHarness(publicTests),
    '/UserCode.tsx': codes.app,
    '/styles.css': codes.styles,
  }), [codes.app, codes.styles, publicTests]);

  async function runPublicTests() {
    setRunning(true);
    setHiddenSummary(null);
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    setConsoleLog((prev) => [...prev, `[${now}] # Running React tests...`]);

    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      iframe.contentWindow?.postMessage({ type: 'RUN_REACT_TESTS' }, '*');
    });

    // Timeout fallback
    setTimeout(() => {
      setRunning((current) => {
        if (current) {
          const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
          setConsoleLog((prev) => [...prev, `[${ts}] ERROR: Test execution timed out`]);
          toast({ title: 'Test timed out', description: 'Preview may still be loading', type: 'error' });
          return false;
        }
        return current;
      });
    }, 10000);
  }

  async function submitHiddenTests() {
    setSubmitting(true);
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    setConsoleLog((prev) => [...prev, `[${ts}] # Submitting for hidden judge...`]);

    try {
      const response = await fetch('/api/submissions/judge-hidden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, framework: 'react', code: codes.app, publicResult: { summary, results } }),
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
  const editorLanguage = activeFile === 'app' ? 'typescript' : 'css';

  return (
    <div className="ide-workspace">
      {/* ─── Side Nav ─── */}
      <aside className="ide-sidenav">
        <div className="ide-sidenav-top">
          <Link href="/questions" className="ide-sidenav-btn mb-4" title="Back to Questions">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </Link>
          <button className="ide-sidenav-btn active" title="Code">
            <Code2 size={24} strokeWidth={1.5} />
          </button>
          <CheatsheetModal type="react" />
        </div>
        <div className="ide-sidenav-bottom">
          <button className="ide-sidenav-btn" title="Help">
            <HelpCircle size={24} strokeWidth={1.5} />
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="ide-content">
        {/* Left Pane: Problem Description */}
        <section className="ide-left-pane" style={{ width: leftWidth, flex: 'none', maxWidth: '70%', minWidth: '300px' }}>
          <div className="ide-left-header">
            <div className="ide-left-title-row flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <h1 className="ide-problem-title">{title}</h1>
                <span className={`diff-badge ${diffClass}`}>{difficulty}</span>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button className="ide-run-btn" disabled={running} onClick={runPublicTests}>
                  <Play size={14} fill="currentColor" /> {running ? 'Running…' : 'Run'}
                </button>
                <button className="ide-submit-btn" disabled={submitting} onClick={submitHiddenTests}>
                  <Upload size={14} /> {submitting ? 'Judging…' : 'Submit'}
                </button>
              </div>
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
                {publicTests.map((test, i) => (
                  <div key={test.id} className="ide-example">
                    <h3 className="ide-example-heading">Example {i + 1}:</h3>
                    <div className="ide-example-block">
                      <div><span className="ide-example-label">Expected:</span> {JSON.stringify(test.expected)}</div>
                      {test.explanation && (
                        <div className="ide-example-explanation">{test.explanation}</div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="ide-solutions-list">
                {loadingSolutions ? (
                  <p className="ide-empty-state">Loading official solutions...</p>
                ) : solutions.length === 0 ? (
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

        {/* Drag Handle */}
        <div
          className="ide-resizer"
          onMouseDown={handleMouseDown}
          style={{
            width: '8px',
            backgroundColor: 'transparent',
            cursor: 'col-resize',
            zIndex: 10,
            margin: '0 -4px',
            position: 'relative',
          }}
        />

        {/* Right Pane: Editor + Console/Preview */}
        <section className="ide-right-pane">
          {/* Editor toolbar with multi-file tabs */}
          <div className="ide-editor-toolbar">
            <div className="ide-editor-tab-bar">
              <button
                className={`ide-file-tab ${activeFile === 'app' ? 'active' : ''}`}
                onClick={() => setActiveFile('app')}
              >
                <FileCode2 size={16} className="inline-block mr-1" /> App.tsx
              </button>
              <button
                className={`ide-file-tab ${activeFile === 'styles' ? 'active' : ''}`}
                onClick={() => setActiveFile('styles')}
              >
                <Palette size={16} className="inline-block mr-1" /> styles.css
              </button>
            </div>
            <div className="ide-editor-actions">
              <span className="ide-react-badge">React v18</span>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="ide-editor-body">
            <Editor
              height="100%"
              language={editorLanguage}
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

          {/* Console / Test Cases / Preview Panel */}
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
              <button
                className={`ide-console-tab ${activeBottomTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveBottomTab('preview')}
              ><Eye size={16} className="inline-block mr-1" /> Preview</button>
            </div>

            <div className="ide-console-body">
              {/* Console output — always mounted, visibility toggled */}
              <div style={{ display: activeBottomTab === 'console' ? 'block' : 'none', height: '100%' }}>
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
                  {results.length > 0 && (
                    <div className="ide-console-results">
                      {results.map((r) => (
                        <div key={r.id} className={`ide-result-badge ${r.passed ? 'pass' : 'fail'}`}>
                          Case {r.id}: {r.passed ? 'Accepted' : 'Failed'}
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
              </div>

              {/* Test Cases — always mounted, visibility toggled */}
              <div style={{ display: activeBottomTab === 'testcases' ? 'block' : 'none', height: '100%' }}>
                <div className="ide-testcases">
                  {publicTests.map((test, i) => (
                    <div key={test.id} className="ide-testcase">
                      <span className="ide-testcase-label">Case {i + 1}</span>
                      <div className="ide-testcase-data">
                        <span>Expected: {JSON.stringify(test.expected)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview — always mounted so Sandpack stays bundled */}
              <div className="ide-preview-wrap" style={{ display: activeBottomTab === 'preview' ? 'flex' : 'none' }}>
                <SandpackProvider
                  template="react-ts"
                  files={sandpackFiles}
                >
                  <SandpackPreview
                    style={{ height: '100%', width: '100%' }}
                    showOpenInCodeSandbox={false}
                    showRefreshButton={true}
                  />
                </SandpackProvider>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/** Generates the hidden test-harness App.tsx that wraps the user component and runs DOM assertions */
function buildTestHarness(publicTests: PublicTest[]): string {
  return `import React, { useEffect, useRef } from 'react';
import UserComponent from './UserCode';
import './styles.css';

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
               output: container.innerHTML.slice(0, 100),
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
}`;
}
