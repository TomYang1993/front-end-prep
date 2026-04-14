'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import { useToast } from '@/components/toast-provider';
import {
  Lightbulb, FileCode2, History,
  Play, Upload, ArrowLeft, ChevronDown, Terminal, X, ChevronUp
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { CheatsheetModal } from '@/components/cheatsheet-modal';
import { usePythonRunner } from '@/hooks/use-python-runner';
import { MarkdownProse } from '@/components/markdown-prose';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useSyntaxTheme } from '@/lib/hooks/use-syntax-theme';
import { CountdownTimer } from '@/components/countdown-timer';
import { DIFFICULTY_LABEL } from '@/types/domain';

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
  questionType?: 'FUNCTION_JS' | 'FUNCTION_PYTHON';
  title: string;
  prompt: string;
  difficulty: string;
  tags: string[];
  starterCode?: Record<string, string>;
  publicTests: PublicTest[];
  expiresAt?: string;
}

interface RunResult {
  id: string;
  passed: boolean;
  output: unknown;
  runtimeMs: number;
  error?: string;
  explanation?: string | null;
  logs?: string[];
}

type LeftTab = 'description' | 'solutions' | 'submissions';

export function EditorWorkspace({
  questionId,
  questionType = 'FUNCTION_JS',
  title,
  prompt,
  difficulty,
  tags,
  starterCode,
  publicTests,
  expiresAt,
}: EditorWorkspaceProps) {
  const { toast } = useToast();
  const syntaxTheme = useSyntaxTheme();
  const [solutions, setSolutions] = useState<SolutionView[]>([]);
  const [loadingSolutions, setLoadingSolutions] = useState(false);

  const [submissions, setSubmissions] = useState<{ id: string; status: string; score: number | null; framework: string; code: string; createdAt: string }[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  const isPython = questionType === 'FUNCTION_PYTHON';
  const pythonRunner = usePythonRunner(isPython);

  const [language, setLanguage] = useState<'javascript' | 'typescript' | 'python'>(
    isPython ? 'python' : 'javascript'
  );
  const [codes, setCodes] = useState<Record<string, string>>(() => {
    if (isPython) {
      return {
        python: starterCode?.python || 'def solve(*args):\n    return None\n',
      } as Record<string, string>;
    }
    return {
      javascript: starterCode?.javascript || 'function solve(...args) {\n  return null;\n}',
      typescript: starterCode?.typescript || starterCode?.javascript || 'function solve(...args): any {\n  return null;\n}',
    } as Record<string, string>;
  });

  const code = codes[language];
  const setCode = (val: string) => {
    setCodes((prev) => ({ ...prev, [language]: val }));
    localStorage.setItem(`draft-${questionId}-${language}`, val);
  };
  const debouncedCode = useDebounce(code, 2000);
  const initialMount = useRef(true);

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    fetch('/api/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, framework: language, code: debouncedCode })
    }).catch(err => console.error('Autosave failed:', err));
  }, [debouncedCode, questionId, language]);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<RunResult[]>([]);
  const [summary, setSummary] = useState<{ passedCount: number; total: number } | null>(null);
  const [consoleHeight, setConsoleHeight] = useState(280);
  const consoleHeightRef = useRef(280);
  const lastOpenConsoleHeightRef = useRef(280);
  const consoleDragStart = useRef<{ y: number; h: number } | null>(null);
  const COLLAPSED_CONSOLE_HEIGHT = 46;
  const isConsoleCollapsed = consoleHeight < 80;

  useEffect(() => {
    consoleHeightRef.current = consoleHeight;
  }, [consoleHeight]);

  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>('description');
  const [monacoTheme, setMonacoTheme] = useState<'vs-dark' | 'light'>('vs-dark');

  useEffect(() => {
    if (activeLeftTab === 'solutions' && solutions.length === 0 && !loadingSolutions) {
      setLoadingSolutions(true);
      fetch(`/api/questions/${questionId}/solutions`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setSolutions(data);
        })
        .finally(() => setLoadingSolutions(false));
    }
  }, [activeLeftTab, questionId, solutions.length, loadingSolutions]);

  useEffect(() => {
    if (activeLeftTab === 'submissions' && submissions.length === 0 && !loadingSubmissions) {
      setLoadingSubmissions(true);
      fetch(`/api/questions/${questionId}/submissions`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setSubmissions(data);
        })
        .finally(() => setLoadingSubmissions(false));
    }
  }, [activeLeftTab, questionId, submissions.length, loadingSubmissions]);

  const [leftWidth, setLeftWidth] = useState(450);
  const isDragging = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const newWidth = Math.max(300, Math.min(e.clientX - 65, window.innerWidth * 0.7));
        setLeftWidth(newWidth);
      }
      if (consoleDragStart.current) {
        const delta = consoleDragStart.current.y - e.clientY;
        const next = Math.max(
          COLLAPSED_CONSOLE_HEIGHT,
          Math.min(consoleDragStart.current.h + delta, window.innerHeight * 0.8)
        );
        setConsoleHeight(next);
      }
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
      }
      if (consoleDragStart.current) {
        consoleDragStart.current = null;
        document.body.style.cursor = '';
        if (consoleHeightRef.current >= 80) {
          lastOpenConsoleHeightRef.current = consoleHeightRef.current;
        }
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

  const handleConsoleMouseDown = (e: React.MouseEvent) => {
    consoleDragStart.current = { y: e.clientY, h: consoleHeight };
    document.body.style.cursor = 'row-resize';
  };

  const toggleConsole = () => {
    if (isConsoleCollapsed) {
      setConsoleHeight(lastOpenConsoleHeightRef.current || 280);
    } else {
      lastOpenConsoleHeightRef.current = consoleHeight;
      setConsoleHeight(COLLAPSED_CONSOLE_HEIGHT);
    }
  };

  const ensureConsoleOpen = () => {
    if (consoleHeightRef.current < 80) {
      setConsoleHeight(lastOpenConsoleHeightRef.current || 280);
    }
  };

  useEffect(() => {
    const updateTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setMonacoTheme(theme === 'light' ? 'light' : 'vs-dark');
    };

    updateTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.attributeName === 'data-theme') {
          updateTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    document.body.style.overflow = 'hidden';

    return () => {
      observer.disconnect();
      document.body.style.overflow = '';
    };
  }, []);

  async function runPublicTests() {
    setRunning(true);
    ensureConsoleOpen();

    try {
      let testResults: RunResult[];

      if (isPython) {
        const pyResults = await pythonRunner.runTests(code, publicTests);
        testResults = pyResults.map((r) => ({
          id: r.id,
          passed: r.passed,
          output: r.output,
          runtimeMs: r.runtimeMs,
          error: r.error,
          logs: r.logs,
        }));
      } else {
        const response = await fetch('/api/playground/run-public', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId, framework: 'javascript', code }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Public test run failed');
        testResults = data.results || [];
      }

      const passedCount = testResults.filter((r) => r.passed).length;
      setSummary({ passedCount, total: testResults.length });
      setResults(testResults);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setResults([{ id: 'runtime-error', passed: false, output: null, runtimeMs: 0, error: msg }]);
      toast({ title: 'Test run failed', description: msg, type: 'error' });
    } finally {
      setRunning(false);
    }
  }

  async function submitHiddenTests() {
    setSubmitting(true);
    ensureConsoleOpen();

    try {
      if (isPython) {
        const testsRes = await fetch(`/api/questions/${questionId}/hidden-tests`);
        if (!testsRes.ok) throw new Error('Failed to fetch hidden tests');
        const hiddenTests: { id: string; input: unknown; expected: unknown }[] = await testsRes.json();

        const pyResults = await pythonRunner.runTests(code, hiddenTests);
        const passedCount = pyResults.filter((r) => r.passed).length;
        const total = pyResults.length;
        const score = total > 0 ? Math.round((passedCount / total) * 100) : 0;
        const status = passedCount === total ? 'PASSED' : 'FAILED';

        await fetch('/api/submissions/judge-hidden', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId,
            framework: 'python',
            code,
            publicResult: { summary, results },
            clientResults: { passedCount, total, score, runtimeMs: pyResults.reduce((s, r) => s + r.runtimeMs, 0) },
          }),
        });

        toast({
          title: status === 'PASSED' ? 'All hidden tests passed!' : `Score: ${score}%`,
          description: `${passedCount}/${total} hidden tests passed`,
          type: status === 'PASSED' ? 'success' : 'info',
        });
      } else {
        const response = await fetch('/api/submissions/judge-hidden', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId, framework: 'javascript', code, publicResult: { summary, results } }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Hidden judge failed');

        toast({
          title: data.status === 'PASSED' ? 'All hidden tests passed!' : `Score: ${data.score}%`,
          description: `${data.passedCount}/${data.total} hidden tests passed`,
          type: data.status === 'PASSED' ? 'success' : 'info',
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Submission failed', description: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  const diffClass = difficulty.toLowerCase();

  return (
    <div className="flex h-screen w-screen ml-[calc(-50vw+50%)] -mt-8 -mb-16 bg-bg overflow-hidden focus-mode:bg-[#15140f]">
      {/* ─── Side Nav ─── */}
      <aside className="w-[64px] bg-black border-r border-line flex flex-col items-center justify-between py-4 z-10">
        <div className="flex flex-col gap-4">
          <Link href="/questions" className="w-10 h-10 rounded-md border-none bg-transparent text-muted text-[1.2rem] cursor-pointer transition-all duration-200 flex items-center justify-center hover:bg-surface-raised hover:text-ink" title="Back to Questions">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </Link>
        </div>
        <div className="flex flex-col gap-4">
          <CheatsheetModal type={isPython ? 'python' : 'js'} />
          <ThemeToggle className="w-10 h-10 rounded-md border-none bg-transparent text-muted cursor-pointer transition-all duration-200 flex items-center justify-center hover:bg-surface-raised hover:text-ink" />

        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex min-w-0">
        {/* Left Pane: Problem Description */}
        <section className={`flex flex-col bg-surface border-r border-line flex-none max-w-[70%] min-w-[300px]`} style={{ width: leftWidth }}>
          <div className="px-6 pt-4 border-b border-line bg-surface-raised">
            <div className={`flex items-center gap-4 mb-4 flex items-center justify-between w-full`}>
              <div className="flex items-center gap-3">
                <h1 className="text-[1.25rem] font-bold m-0">{title}</h1>
                <span className={`inline-flex items-center justify-center px-2 py-[0.3rem] rounded-sm text-[0.65rem] font-bold uppercase tracking-[0.05em] leading-none ${diffClass === 'easy' ? 'bg-good-subtle text-good' : diffClass === 'medium' ? 'bg-caution-subtle text-caution' : 'bg-warn-subtle text-warn'}`}>{DIFFICULTY_LABEL[difficulty] ?? difficulty}</span>
              </div>
              {expiresAt && <CountdownTimer expiresAt={expiresAt} />}
            </div>
            <div className="flex gap-6">
              <button
                className={`py-2 text-[0.75rem] font-bold uppercase tracking-[0.05em] bg-transparent border-none border-b-2 border-transparent text-muted cursor-pointer transition-all duration-200 hover:text-ink [&.active]:text-ink [&.active]:border-brand ${activeLeftTab === 'description' ? 'active' : ''}`}
                onClick={() => setActiveLeftTab('description')}
              >Description</button>
              <button
                className={`py-2 text-[0.75rem] font-bold uppercase tracking-[0.05em] bg-transparent border-none border-b-2 border-transparent text-muted cursor-pointer transition-all duration-200 hover:text-ink [&.active]:text-ink [&.active]:border-brand ${activeLeftTab === 'solutions' ? 'active' : ''}`}
                onClick={() => setActiveLeftTab('solutions')}
              ><Lightbulb size={16} className="inline-block mr-1" /> Solutions</button>
              <button
                className={`py-2 text-[0.75rem] font-bold uppercase tracking-[0.05em] bg-transparent border-none border-b-2 border-transparent text-muted cursor-pointer transition-all duration-200 hover:text-ink [&.active]:text-ink [&.active]:border-brand ${activeLeftTab === 'submissions' ? 'active' : ''}`}
                onClick={() => setActiveLeftTab('submissions')}
              ><History size={16} className="inline-block mr-1" /> Submissions</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeLeftTab === 'description' ? (
              <>
                <div className="flex flex-wrap gap-2 mb-6">
                  {tags.map((tag) => (
                    <span key={tag} className="text-[0.65rem] py-1 px-2 bg-surface-raised rounded-sm text-ink-secondary">{tag}</span>
                  ))}
                </div>

                <div className="text-[0.95rem] leading-[1.6] text-ink mb-8">
                  <MarkdownProse>{prompt}</MarkdownProse>
                </div>

                {publicTests.map((test, i) => {
                  const inp = test.input as {
                    args?: unknown[];
                    setup?: string;
                    assertions?: { expr: string; desc: string }[];
                  } | null;
                  const isAssertionTest = Array.isArray(inp?.assertions);
                  return (
                  <div key={test.id} className="mb-6">
                    <h3 className="text-[0.75rem] uppercase tracking-[0.1em] font-bold text-muted m-0 mb-2">Example {i + 1}:</h3>
                    <div className="bg-surface-raised border-l-[3px] border-brand p-4 rounded-r-md font-mono text-[0.85rem] text-ink-secondary flex flex-col gap-3">
                      {isAssertionTest ? (
                        <>
                          {inp?.setup && (
                            <div>
                              <span className="text-muted text-[0.7rem] uppercase tracking-wider block mb-1">Setup</span>
                              <pre className="m-0 whitespace-pre-wrap break-words text-ink">{inp.setup}</pre>
                            </div>
                          )}
                          <div>
                            <span className="text-muted text-[0.7rem] uppercase tracking-wider block mb-1">Expects</span>
                            <ul className="list-none pl-0 m-0 space-y-1">
                              {inp!.assertions!.map((a, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-muted shrink-0 mt-[1px]">•</span>
                                  <span className="text-ink">{a.desc}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      ) : (
                        <>
                          <div><span className="text-muted">Input:</span> {JSON.stringify(inp?.args)}</div>
                          <div><span className="text-muted">Output:</span> {JSON.stringify(test.expected)}</div>
                        </>
                      )}
                      {test.explanation && (
                        <div className="text-muted text-[0.8rem]">{test.explanation}</div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </>
            ) : activeLeftTab === 'solutions' ? (
              <div className="flex flex-col gap-6">
                {loadingSolutions ? (
                  <p className="text-muted text-center py-8">Loading official solutions...</p>
                ) : solutions.length === 0 ? (
                  <p className="text-muted text-center py-8">No official solutions published yet.</p>
                ) : (
                  solutions.map((sol) => (
                    <article key={sol.id} className="bg-surface-raised border border-line rounded-md p-6">
                      <div className="flex gap-4 text-[0.75rem] text-muted mb-4 uppercase tracking-[0.05em]">
                        <span>{sol.language}</span>
                        {sol.complexity && <span>{sol.complexity}</span>}
                      </div>
                      <MarkdownProse className="text-[0.9rem]">{sol.explanation}</MarkdownProse>
                      <div className="mt-4 rounded-md overflow-hidden">
                        <SyntaxHighlighter
                          style={syntaxTheme}
                          language={sol.language === 'typescript' ? 'typescript' : 'javascript'}
                          customStyle={{ margin: 0, borderRadius: '0.375rem', fontSize: '0.82rem', lineHeight: '1.6' }}
                        >
                          {sol.code}
                        </SyntaxHighlighter>
                      </div>
                    </article>
                  ))
                )}
              </div>
            ) : activeLeftTab === 'submissions' ? (
              <div className="flex flex-col gap-2">
                {loadingSubmissions ? (
                  <p className="text-muted text-center py-8">Loading submissions...</p>
                ) : submissions.length === 0 ? (
                  <p className="text-muted text-center py-8">No submissions yet.</p>
                ) : (
                  submissions.map((sub) => {
                    const isExpanded = expandedSubmission === sub.id;
                    const passed = sub.status === 'PASSED';
                    const lang = sub.framework === 'typescript' ? 'typescript' : sub.framework === 'python' ? 'python' : 'javascript';
                    return (
                      <div key={sub.id} className="border border-line rounded-md overflow-hidden">
                        <button
                          onClick={() => setExpandedSubmission(isExpanded ? null : sub.id)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-surface-raised hover:bg-surface text-left transition-colors cursor-pointer border-none"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`text-[0.7rem] font-bold uppercase ${passed ? 'text-good' : 'text-warn'}`}>
                              {sub.status}
                            </span>
                            {sub.score !== null && (
                              <span className="text-[0.7rem] text-muted">{sub.score}%</span>
                            )}
                            <span className="text-[0.65rem] text-muted uppercase">{sub.framework}</span>
                          </div>
                          <span className="text-[0.7rem] text-muted">
                            {new Date(sub.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-line">
                            <SyntaxHighlighter
                              style={syntaxTheme}
                              language={lang}
                              customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.82rem', lineHeight: '1.6' }}
                            >
                              {sub.code}
                            </SyntaxHighlighter>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>
        </section>

        {/* Drag Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="w-2 bg-transparent cursor-col-resize z-10 -mx-1 relative shrink-0"
        />

        {/* Right Pane: Editor + Console */}
        <section className="flex-1 flex flex-col bg-surface-raised min-w-[400px] dark:bg-black focus-mode:bg-black">
          <div className="h-10 bg-surface border-b border-line flex justify-between items-center px-4 shrink-0">
            <div className="flex items-center h-full">
              <span className={`font-mono text-[0.75rem] font-bold text-muted h-full flex items-center px-4 bg-transparent border-none border-b-2 border-transparent cursor-pointer transition-colors duration-200 hover:text-ink-secondary [&.active]:text-brand [&.active]:border-brand active`}>
                <FileCode2 size={16} className="inline-block mr-1" />
                {isPython ? 'solution.py' : language === 'javascript' ? 'Solution.js' : 'Solution.ts'}
              </span>
              {isPython && pythonRunner.loading && (
                <span className="ml-3 text-[0.7rem] text-accent-tertiary animate-pulse">Loading Python runtime…</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isPython ? (
                <span className="font-mono text-[0.7rem] font-semibold text-accent-tertiary bg-accent-tertiary/10 px-3 py-1 rounded-md">Python 3.11</span>
              ) : (
                <div className="relative">
                  <select
                    className="appearance-none bg-surface-raised border border-line text-ink font-mono text-xs font-semibold py-[0.35rem] pr-7 pl-3 rounded-md outline-none cursor-pointer transition-all duration-200 shadow-sm hover:border-brand hover:bg-brand/10 focus:border-brand focus:ring-2 focus:ring-brand/20"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'javascript' | 'typescript')}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted" />
                </div>
              )}
              <span className="mx-1 h-5 w-px bg-line" />
              <button
                className="inline-flex items-center gap-1.5 bg-transparent border border-brand text-brand py-[0.3rem] px-[1rem] rounded-md text-[0.7rem] font-bold cursor-pointer transition-all duration-200 hover:bg-brand/10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={running || (isPython && pythonRunner.loading)}
                onClick={runPublicTests}
              >
                <Play size={12} fill="currentColor" /> {running ? 'Running…' : 'Run'}
              </button>
              <button
                className="inline-flex items-center gap-1.5 bg-brand text-white border-none py-[0.3rem] px-[1.2rem] rounded-md text-[0.7rem] font-bold cursor-pointer transition-all duration-200 shadow-[0_0_12px_rgba(37,99,235,0.25)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting || (isPython && pythonRunner.loading)}
                onClick={submitHiddenTests}
              >
                <Upload size={12} /> {submitting ? 'Judging…' : 'Submit'}
              </button>
            </div>
          </div>

          <div className="flex-1 relative flex flex-col min-h-0">
            <div className="relative flex-1 min-h-0">
              <Editor
                height="100%"
                language={language}
                theme={monacoTheme}
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  padding: { top: 12, bottom: 0 },
                  lineNumbersMinChars: 3,
                  scrollBeyondLastLine: false,
                  renderLineHighlight: 'gutter',
                  fontFamily: 'var(--font-mono), JetBrains Mono, monospace',
                }}
              />
            </div>

            {/* Console: resizable drawer with draggable top border */}
            <div className="bg-surface flex flex-col shrink-0" style={{ height: consoleHeight }}>
              <div
                onMouseDown={handleConsoleMouseDown}
                className="h-1.5 shrink-0 bg-line hover:bg-brand/50 cursor-row-resize transition-colors"
                title="Drag to resize console"
              />
              <div
                className="h-10 flex items-center justify-between px-4 cursor-pointer hover:bg-bg-subtle/50 transition-colors shrink-0"
                onClick={toggleConsole}
              >
                <div className="flex items-center gap-2 text-muted font-bold tracking-wider text-[0.7rem] uppercase">
                  <Terminal size={14} /> Console
                  {results.length > 0 && isConsoleCollapsed && (
                    <span className={`ml-2 px-1.5 py-0.5 rounded-sm text-[0.6rem] ${summary?.passedCount === summary?.total ? 'bg-good-subtle text-good' : 'bg-warn-subtle text-warn'}`}>
                      {summary?.passedCount}/{summary?.total}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted">
                   <span className="p-1 hover:bg-line rounded-md transition-colors">
                     {isConsoleCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                   </span>
                </div>
              </div>

              {!isConsoleCollapsed && (
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-bg">
                  {running ? (
                    <div className="flex items-center justify-center h-full text-muted text-sm font-mono animate-pulse">Running tests...</div>
                  ) : results.length > 0 ? (
                    <>
                      {summary && (
                        <div className={`text-sm font-bold flex items-center gap-2 border-b border-line pb-4 ${summary.passedCount === summary.total ? 'text-good' : 'text-warn'}`}>
                          <span className={`w-2 h-2 rounded-full ${summary.passedCount === summary.total ? 'bg-good' : 'bg-warn'}`}></span>
                          {summary.passedCount} / {summary.total} Tests Passed
                        </div>
                      )}
                      {results.map((r, i) => {
                        const testInput = publicTests[i]?.input as {
                          args?: unknown[];
                          setup?: string;
                          assertions?: { expr: string; desc: string }[];
                        } | undefined;
                        const isAssertionResult = Array.isArray(testInput?.assertions);
                        const assertionOutputs = Array.isArray(r.output)
                          ? (r.output as { desc: string; passed: boolean; error?: string }[])
                          : null;
                        return (
                        <div key={r.id || i} className="bg-surface-raised border border-line rounded-md p-4 text-sm font-mono shadow-sm">
                          <div className={`font-bold mb-3 flex items-center gap-2 ${r.passed ? 'text-good' : 'text-warn'}`}>
                             {r.passed ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                             ) : (
                                <X size={14} strokeWidth={3} />
                             )}
                             Test {i + 1}
                          </div>
                          <div className="space-y-3">
                            {isAssertionResult && assertionOutputs ? (
                              <>
                                {testInput?.setup && (
                                  <div>
                                    <span className="text-muted text-xs block mb-1">Setup:</span>
                                    <pre className="m-0 text-ink text-[13px] bg-surface px-3 py-2 rounded border border-line whitespace-pre-wrap break-words">{testInput.setup}</pre>
                                  </div>
                                )}
                                <ul className="list-none pl-0 m-0 space-y-1">
                                  {assertionOutputs.map((a, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-[13px]">
                                      {a.passed ? (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-good shrink-0 mt-[3px]"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                      ) : (
                                        <X size={12} strokeWidth={3} className="text-warn shrink-0 mt-[3px]" />
                                      )}
                                      <span className={a.passed ? 'text-ink-secondary' : 'text-ink'}>
                                        {a.desc}
                                        {a.error && <span className="text-warn ml-2">— {a.error}</span>}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            ) : (
                              <>
                            {!r.passed && publicTests[i] && (
                              <div>
                                <span className="text-muted text-xs block mb-1">Input:</span>
                                <div className="text-ink text-[13px] bg-surface px-3 py-2 rounded border border-line break-all">
                                  {JSON.stringify(testInput?.args || testInput)}
                                </div>
                              </div>
                            )}
                            {!r.passed && publicTests[i] && (
                             <div>
                                <span className="text-muted text-xs block mb-1">Expected:</span>
                                <div className="text-good text-[13px] bg-surface px-3 py-2 rounded border border-line break-all">
                                  {JSON.stringify(publicTests[i].expected)}
                                </div>
                              </div>
                            )}
                            {!r.passed && (r.error || r.output !== undefined) && (
                              <div>
                                <span className="text-muted text-xs block mb-1">Actual:</span>
                                {r.error ? (
                                  <div className="text-warn text-[13px] bg-warn-subtle/30 px-3 py-2 rounded border border-warn/20 whitespace-pre-wrap break-all">
                                    {String(r.error)}
                                  </div>
                                ) : (
                                  <div className="text-warn text-[13px] bg-surface px-3 py-2 rounded border border-line break-all">
                                    {String(r.output)}
                                  </div>
                                )}
                              </div>
                            )}
                              </>
                            )}
                            {r.logs && r.logs.length > 0 && (
                              <div>
                                <span className="text-muted text-xs block mb-1">Stdout:</span>
                                <div className="text-ink-secondary text-[13px] bg-surface px-3 py-2 rounded border border-line whitespace-pre-wrap break-all">
                                  {r.logs.join('\\n')}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted text-sm font-mono">
                      Run your code to see results
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </section>
      </div>
    </div>
  );
}
