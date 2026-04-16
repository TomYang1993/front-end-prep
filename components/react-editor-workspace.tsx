'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor as monacoEditor } from 'monaco-editor';
import { SandpackProvider, SandpackPreview, SandpackLayout, useSandpack, useSandpackNavigation } from '@codesandbox/sandpack-react';
import { useToast } from '@/components/toast-provider';
import {
  Lightbulb, FileCode2,
  Upload, ArrowLeft, Eye, Palette, History, RotateCw
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { CheatsheetModal } from '@/components/cheatsheet-modal';
import { MarkdownProse } from '@/components/markdown-prose';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useSyntaxTheme } from '@/lib/hooks/use-syntax-theme';
import { CountdownTimer } from '@/components/countdown-timer';
import { DIFFICULTY_LABEL } from '@/types/domain';
import { BottomPanel, type BottomTab, type SubmitResult } from '@/components/bottom-panel';

interface SolutionView {
  id: string;
  language: string;
  framework: string | null;
  explanation: string;
  code: string;
  complexity: string | null;
}

export interface ReactEditorWorkspaceProps {
  questionId: string;
  title: string;
  prompt: string;
  difficulty: string;
  tags: string[];
  starterCode?: Record<string, string>;
  expiresAt?: string;
}

type ActiveFile = 'app' | 'styles';
type LeftTab = 'description' | 'solutions' | 'submissions';

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
  expiresAt,
}: ReactEditorWorkspaceProps) {
  const { toast } = useToast();
  const syntaxTheme = useSyntaxTheme();
  const [solutions, setSolutions] = useState<SolutionView[]>([]);
  const [loadingSolutions, setLoadingSolutions] = useState(false);
  const [solutionsLoaded, setSolutionsLoaded] = useState(false);

  const [submissions, setSubmissions] = useState<{ id: string; status: string; score: number | null; framework: string; code: string; createdAt: string }[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionsLoaded, setSubmissionsLoaded] = useState(false);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  const [activeFile, setActiveFile] = useState<ActiveFile>('app');
  const [codes, setCodes] = useState({
    app: starterCode?.react || DEFAULT_APP_CODE,
    styles: starterCode?.css || DEFAULT_CSS,
  });

  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
  const code = codes[activeFile];
  const setCode = (val: string) => {
    setCodes((prev) => ({ ...prev, [activeFile]: val }));
  };

  const debouncedCodes = useDebounce(codes, 2000);
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
      body: JSON.stringify({ questionId, framework: 'react', code: JSON.stringify(debouncedCodes) })
    }).catch(err => console.error('Autosave failed:', err));
  }, [debouncedCodes, questionId]);

  // Flush unsaved changes on page leave
  useEffect(() => {
    const flush = () => {
      const currentCode = editorRef.current?.getValue();
      if (currentCode == null) return;
      const payload = { ...codes, [activeFile]: currentCode };
      navigator.sendBeacon(
        '/api/drafts',
        new Blob(
          [JSON.stringify({ questionId, framework: 'react', code: JSON.stringify(payload) })],
          { type: 'application/json' },
        ),
      );
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, [questionId, codes, activeFile]);

  // ─── Results state ───
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('results');

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

  // Lazy-load solutions
  useEffect(() => {
    if (activeLeftTab !== 'solutions' || solutionsLoaded || loadingSolutions) return;
    setLoadingSolutions(true);
    fetch(`/api/questions/${questionId}/solutions`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setSolutions(data); })
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

  // When active file changes, push stored code into editor
  const prevFileRef = useRef(activeFile);
  useEffect(() => {
    if (prevFileRef.current !== activeFile && editorRef.current) {
      editorRef.current.setValue(codes[activeFile]);
      prevFileRef.current = activeFile;
    }
  }, [activeFile, codes]);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
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

  // Build Sandpack files — minimal per docs: template 'react' + /App.js
  const sandpackFiles = useMemo(() => ({
    '/App.js': codes.app,
    '/styles.css': codes.styles,
  }), [codes.app, codes.styles]);

  async function submitTests() {
    setSubmitting(true);
    ensureConsoleOpen();
    setActiveBottomTab('results');

    try {
      const res = await fetch('/api/submissions/judge-hidden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          framework: 'react',
          code: JSON.stringify({ app: codes.app, styles: codes.styles }),
        }),
      });
      const data = await res.json();

      const passedCount: number = data.passedCount ?? 0;
      const total: number = data.total ?? 0;
      const score: number = data.score ?? 0;
      const status: 'PASSED' | 'FAILED' = data.status === 'PASSED' ? 'PASSED' : 'FAILED';

      setSubmitResult({
        score,
        status,
        passedCount,
        total,
        publicResults: [],
        hiddenResults: data.hiddenResults ?? [],
      });

      toast({
        title: status === 'PASSED' ? 'All tests passed!' : `Score: ${score}%`,
        description: `${passedCount}/${total} tests passed`,
        type: status === 'PASSED' ? 'success' : 'info',
      });
    } catch {
      toast({ title: 'Submission failed', description: 'Something went wrong.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  const diffClass = difficulty.toLowerCase();
  const editorLanguage = activeFile === 'app' ? 'typescript' : 'css';

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
          <CheatsheetModal type="react" />
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
                    const lang = sub.framework === 'typescript' ? 'typescript' : 'javascript';
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

        {/* Editor Pane + Bottom Panel */}
        <section className="flex-1 flex flex-col bg-surface-raised min-w-[300px] dark:bg-black focus-mode:bg-black">
          <div className="h-10 bg-surface border-b border-line flex justify-between items-center px-4 shrink-0">
            <div className="flex items-center h-full">
              <button
                className={`font-mono text-[0.75rem] font-bold text-muted h-full flex items-center px-4 bg-transparent border-none border-b-2 border-transparent cursor-pointer transition-colors duration-200 hover:text-ink-secondary [&.active]:text-brand [&.active]:border-brand ${activeFile === 'app' ? 'active' : ''}`}
                onClick={() => setActiveFile('app')}
              >
                <FileCode2 size={16} className="inline-block mr-1" /> App.tsx
              </button>
              <button
                className={`font-mono text-[0.75rem] font-bold text-muted h-full flex items-center px-4 bg-transparent border-none border-b-2 border-transparent cursor-pointer transition-colors duration-200 hover:text-ink-secondary [&.active]:text-brand [&.active]:border-brand ${activeFile === 'styles' ? 'active' : ''}`}
                onClick={() => setActiveFile('styles')}
              >
                <Palette size={16} className="inline-block mr-1" /> styles.css
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center gap-1.5 bg-brand text-white border-none py-[0.3rem] px-[1.2rem] rounded-md text-[0.7rem] font-bold cursor-pointer transition-all duration-200 shadow-[0_0_12px_rgba(37,99,235,0.25)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
                onClick={submitTests}
              >
                <Upload size={12} /> {submitting ? 'Judging\u2026' : 'Submit'}
              </button>
            </div>
          </div>

          <div className="flex-1 relative flex flex-col min-h-0">
            <div className="relative flex-1 min-h-0">
              <Editor
                height="100%"
                language={editorLanguage}
                theme={monacoTheme}
                defaultValue={code}
                onMount={handleEditorMount}
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

            {/* Bottom Panel */}
            <BottomPanel
              activeTab={activeBottomTab}
              onTabChange={setActiveBottomTab}
              height={consoleHeight}
              collapsed={isConsoleCollapsed}
              onToggleCollapse={toggleConsole}
              onMouseDown={handleConsoleMouseDown}
              testCode=""
              testResults={[]}
              mode="react"
              submitResult={submitResult}
              isRunning={false}
              isSubmitting={submitting}
            />
          </div>
        </section>

        {/* Preview Column */}
        <section className="flex-1 flex flex-col border-l border-line min-w-[300px]">
          <SandpackProvider template="react" files={sandpackFiles}>
            <div className="h-10 bg-surface border-b border-line flex items-center justify-between px-4 shrink-0">
              <span className="text-[0.75rem] font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                <Eye size={16} /> Preview
              </span>
              <PreviewRefreshButton />
            </div>
            <SandpackStatusBar />
            <div className="flex-1 bg-[#f9fafb] dark:bg-white overflow-hidden flex flex-col [&>div]:flex-1 [&>div]:!h-auto">
              <SandpackLayout style={{ height: '100%', border: 'none' }}>
                <SandpackPreview
                  style={{ height: '100%', width: '100%' }}
                  showOpenInCodeSandbox={false}
                  showRefreshButton={false}
                />
              </SandpackLayout>
            </div>
          </SandpackProvider>
        </section>
      </div>
    </div>
  );
}

function PreviewRefreshButton() {
  const { refresh } = useSandpackNavigation();
  return (
    <button
      type="button"
      onClick={() => refresh()}
      className="w-7 h-7 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-surface-raised transition-colors"
      title="Refresh preview"
    >
      <RotateCw size={14} />
    </button>
  );
}

function SandpackStatusBar() {
  const { sandpack } = useSandpack();
  const { status, error, bundlerState } = sandpack;

  const progress = bundlerState?.transpiledModules
    ? `${Object.keys(bundlerState.transpiledModules).length} modules`
    : null;

  return (
    <div className="px-3 py-1.5 bg-black text-[11px] font-mono border-b border-line shrink-0 flex items-center gap-2 text-white/80">
      <span className="text-muted">sandpack:</span>
      <span className={
        status === 'idle' ? 'text-good'
        : status === 'timeout' ? 'text-warn'
        : 'text-caution'
      }>
        {status}
      </span>
      {progress && <span className="text-muted">· {progress}</span>}
      {error && (
        <span className="text-warn truncate">· {error.message}</span>
      )}
    </div>
  );
}

