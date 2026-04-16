'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor as monacoEditor } from 'monaco-editor';
import { useToast } from '@/components/toast-provider';
import {
  Lightbulb, FileCode2, History,
  Play, Upload, ArrowLeft, ChevronDown,
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
import { BottomPanel, type BottomTab, type TestResult, type SubmitResult } from '@/components/bottom-panel';

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
  publicTestCode: string;
  expiresAt?: string;
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
  publicTestCode,
  expiresAt,
}: EditorWorkspaceProps) {
  const { toast } = useToast();
  const syntaxTheme = useSyntaxTheme();
  const [solutions, setSolutions] = useState<SolutionView[]>([]);
  const [loadingSolutions, setLoadingSolutions] = useState(false);
  const [solutionsLoaded, setSolutionsLoaded] = useState(false);

  const [submissions, setSubmissions] = useState<{ id: string; status: string; score: number | null; framework: string; code: string; createdAt: string }[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionsLoaded, setSubmissionsLoaded] = useState(false);
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

  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);

  /** Read current code from editor instance (source of truth) or fall back to state */
  const getCode = useCallback(() => {
    return editorRef.current?.getValue() ?? codes[language];
  }, [codes, language]);

  const code = codes[language];
  const setCode = (val: string) => {
    setCodes((prev) => ({ ...prev, [language]: val }));
  };
  const debouncedCode = useDebounce(code, 2000);
  const initialMount = useRef(true);

  // Persist draft to server (debounced)
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

  // Flush unsaved changes on page leave
  useEffect(() => {
    const flush = () => {
      const currentCode = editorRef.current?.getValue();
      if (currentCode == null) return;
      navigator.sendBeacon(
        '/api/drafts',
        new Blob(
          [JSON.stringify({ questionId, framework: language, code: currentCode })],
          { type: 'application/json' },
        ),
      );
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, [questionId, language]);

  // ─── Test/Console/Results state ───
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('tests');

  // ─── Bottom panel resize ───
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
    if (activeLeftTab !== 'solutions' || solutionsLoaded || loadingSolutions) return;
    setLoadingSolutions(true);
    fetch(`/api/questions/${questionId}/solutions`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSolutions(data);
      })
      .finally(() => {
        setLoadingSolutions(false);
        setSolutionsLoaded(true);
      });
  }, [activeLeftTab, questionId, solutionsLoaded, loadingSolutions]);

  useEffect(() => {
    if (activeLeftTab !== 'submissions' || submissionsLoaded || loadingSubmissions) return;
    setLoadingSubmissions(true);
    fetch(`/api/questions/${questionId}/submissions`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSubmissions(data);
      })
      .finally(() => {
        setLoadingSubmissions(false);
        setSubmissionsLoaded(true);
      });
  }, [activeLeftTab, questionId, submissionsLoaded, loadingSubmissions]);

  // ─── Drag handles ───
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

  // When language changes, push the stored code into the editor imperatively
  const prevLanguageRef = useRef(language);
  useEffect(() => {
    if (prevLanguageRef.current !== language && editorRef.current) {
      editorRef.current.setValue(codes[language]);
      prevLanguageRef.current = language;
    }
  }, [language, codes]);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
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

  // ─── Run public tests ───
  async function runPublicTests() {
    setRunning(true);
    ensureConsoleOpen();
    const currentCode = getCode();

    try {
      const response = await fetch('/api/playground/run-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, framework: isPython ? 'python' : 'javascript', code: currentCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Public test run failed');

      const results: TestResult[] = data.results || [];
      const logs: string[] = data.logs || [];

      setTestResults(results);
      setConsoleLogs((prev) => [...prev, ...logs]);

      if (logs.length > 0) {
        setActiveBottomTab('console');
      } else {
        setActiveBottomTab('tests');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setTestResults([{ name: 'Execution Error', passed: false, error: msg }]);
      setActiveBottomTab('tests');
      toast({ title: 'Test run failed', description: msg, type: 'error' });
    } finally {
      setRunning(false);
    }
  }

  // ─── Submit hidden tests ───
  async function submitHiddenTests() {
    setSubmitting(true);
    ensureConsoleOpen();
    const currentCode = getCode();

    try {
      const response = await fetch('/api/submissions/judge-hidden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, framework: isPython ? 'python' : 'javascript', code: currentCode }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Hidden judge failed');

      setSubmitResult({
        score: data.score,
        status: data.status,
        passedCount: data.passedCount,
        total: data.total,
        publicResults: testResults,
        hiddenResults: data.hiddenResults || [],
      });
      setActiveBottomTab('results');

      toast({
        title: data.status === 'PASSED' ? 'All hidden tests passed!' : `Score: ${data.score}%`,
        description: `${data.passedCount}/${data.total} hidden tests passed`,
        type: data.status === 'PASSED' ? 'success' : 'info',
      });
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
        <section className={`flex flex-col bg-surface border-r border-line flex-none max-w-[70%] min-w-[400px]`} style={{ width: leftWidth }}>
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

        {/* Right Pane: Editor + Bottom Panel */}
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
                defaultValue={code}
                onMount={handleEditorMount}
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

            {/* Bottom Panel */}
            <BottomPanel
              activeTab={activeBottomTab}
              onTabChange={setActiveBottomTab}
              height={consoleHeight}
              collapsed={isConsoleCollapsed}
              onToggleCollapse={toggleConsole}
              onMouseDown={handleConsoleMouseDown}
              testCode={publicTestCode}
              testResults={testResults}
              mode="js"
              consoleLogs={consoleLogs}
              onClearConsole={() => setConsoleLogs([])}
              submitResult={submitResult}
              isRunning={running}
              isSubmitting={submitting}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
