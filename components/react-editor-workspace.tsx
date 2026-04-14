'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import { SandpackProvider, SandpackPreview } from '@codesandbox/sandpack-react';
import { useToast } from '@/components/toast-provider';
import {
  Lightbulb, FileCode2,
  Upload, ArrowLeft, Eye, Palette, History
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { CheatsheetModal } from '@/components/cheatsheet-modal';
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

interface ReactEditorWorkspaceProps {
  questionId: string;
  title: string;
  prompt: string;
  difficulty: string;
  tags: string[];
  starterCode?: Record<string, string>;
  publicTests: PublicTest[];
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
  publicTests,
  expiresAt,
}: ReactEditorWorkspaceProps) {
  const { toast } = useToast();
  const syntaxTheme = useSyntaxTheme();
  const [solutions, setSolutions] = useState<SolutionView[]>([]);
  const [loadingSolutions, setLoadingSolutions] = useState(false);

  const [submissions, setSubmissions] = useState<{ id: string; status: string; score: number | null; framework: string; code: string; createdAt: string }[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  const [activeFile, setActiveFile] = useState<ActiveFile>('app');
  const [codes, setCodes] = useState({
    app: starterCode?.react || DEFAULT_APP_CODE,
    styles: starterCode?.css || DEFAULT_CSS,
  });

  const code = codes[activeFile];
  const setCode = (val: string) => {
    setCodes((prev) => ({ ...prev, [activeFile]: val }));
    localStorage.setItem(`draft-${questionId}-react`, JSON.stringify({ ...codes, [activeFile]: val }));
  };

  const debouncedCodes = useDebounce(codes, 2000);
  const initialMount = useRef(true);

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

  const [submitting, setSubmitting] = useState(false);

  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>('description');
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

  // Build Sandpack files (test harness + user code + user styles)
  const sandpackFiles = useMemo(() => ({
    '/App.tsx': buildTestHarness(publicTests),
    '/UserCode.tsx': codes.app,
    '/styles.css': codes.styles,
  }), [codes.app, codes.styles, publicTests]);

  async function submitHiddenTests() {
    setSubmitting(true);
    try {
      const response = await fetch('/api/submissions/judge-hidden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, framework: 'react', code: codes.app }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Hidden judge failed');

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
                {publicTests.map((test, i) => (
                  <div key={test.id} className="mb-6">
                    <h3 className="text-[0.75rem] uppercase tracking-[0.1em] font-bold text-muted m-0 mb-2">Example {i + 1}:</h3>
                    <div className="bg-surface-raised border-l-[3px] border-brand p-4 rounded-r-md font-mono text-[0.85rem] text-ink-secondary flex flex-col gap-2">
                      <div><span className="text-muted">Expected:</span> {JSON.stringify(test.expected)}</div>
                      {test.explanation && (
                        <div>{test.explanation}</div>
                      )}
                    </div>
                  </div>
                ))}
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

        {/* Editor Pane */}
        <section className="flex-1 flex flex-col bg-surface-raised min-w-[300px] dark:bg-black focus-mode:bg-black">
          <div className="h-10 bg-surface border-b border-line flex justify-between items-center px-4">
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
            <div className="flex gap-2">
              <span className="font-mono text-[0.65rem] font-semibold text-muted bg-surface-raised border border-line py-[0.2rem] px-[0.6rem] rounded-sm">React v18</span>
            </div>
          </div>

          <div className="flex-1 relative min-h-[200px]">
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

        </section>

        {/* Preview Column */}
        <section className="flex-1 flex flex-col border-l border-line min-w-[300px]">
          <div className="h-10 bg-surface border-b border-line flex items-center justify-between px-4">
            <span className="text-[0.75rem] font-bold text-muted uppercase tracking-wider flex items-center gap-2">
              <Eye size={16} /> Preview
            </span>
            <button
              className="inline-flex items-center gap-1.5 bg-brand text-white border-none py-[0.3rem] px-[1.2rem] rounded-md text-[0.7rem] font-bold cursor-pointer transition-all duration-200 shadow-[0_0_12px_rgba(37,99,235,0.25)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
              onClick={submitHiddenTests}
            >
              <Upload size={12} /> {submitting ? 'Judging…' : 'Submit'}
            </button>
          </div>
          <div className="flex-1 bg-[#f9fafb] dark:bg-white overflow-hidden">
            <SandpackProvider template="react-ts" files={sandpackFiles}>
              <SandpackPreview
                style={{ height: '100%', width: '100%' }}
                showOpenInCodeSandbox={false}
                showRefreshButton={true}
              />
            </SandpackProvider>
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
