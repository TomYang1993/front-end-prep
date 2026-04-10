'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import { useToast } from '@/components/toast-provider';
import {
  Lightbulb, HelpCircle, FileCode2,
  Play, Upload, ArrowLeft
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { CheatsheetModal } from '@/components/cheatsheet-modal';
import { usePythonRunner } from '@/hooks/use-python-runner';

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

type LeftTab = 'description' | 'solutions';

export function EditorWorkspace({
  questionId,
  questionType = 'FUNCTION_JS',
  title,
  prompt,
  difficulty,
  tags,
  starterCode,
  publicTests,
}: EditorWorkspaceProps) {
  const { toast } = useToast();
  const [solutions, setSolutions] = useState<SolutionView[]>([]);
  const [loadingSolutions, setLoadingSolutions] = useState(false);

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
          <button className="w-10 h-10 rounded-md border-none bg-transparent text-muted text-[1.2rem] cursor-pointer transition-all duration-200 flex items-center justify-center hover:bg-surface-raised hover:text-ink" title="Help"><HelpCircle size={24} strokeWidth={1.5} /></button>
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
                <span className={`inline-flex items-center justify-center px-2 py-[0.3rem] rounded-sm text-[0.65rem] font-bold uppercase tracking-[0.05em] leading-none ${diffClass === 'easy' ? 'bg-good-subtle text-good' : diffClass === 'medium' ? 'bg-accent-tertiary/12 text-accent-tertiary' : 'bg-warn-subtle text-warn'}`}>{difficulty}</span>
              </div>

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
                  <p>{prompt}</p>
                </div>

                {publicTests.map((test, i) => (
                  <div key={test.id} className="mb-6">
                    <h3 className="text-[0.75rem] uppercase tracking-[0.1em] font-bold text-muted m-0 mb-2">Example {i + 1}:</h3>
                    <div className="bg-surface-raised border-l-[3px] border-brand p-4 rounded-r-md font-mono text-[0.85rem] text-ink-secondary flex flex-col gap-2">
                      <div><span className="text-muted">Input:</span> {JSON.stringify((test.input as { args?: unknown[] })?.args)}</div>
                      <div><span className="text-muted">Output:</span> {JSON.stringify(test.expected)}</div>
                      {test.explanation && (
                        <div>{test.explanation}</div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
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
                      <p>{sol.explanation}</p>
                      <pre className="bg-surface p-4 rounded-md overflow-x-auto font-mono text-[0.8rem] text-ink-secondary mt-4 dark:bg-black"><code>{sol.code}</code></pre>
                    </article>
                  ))
                )}
              </div>
            )}
          </div>
        </section>

        {/* Drag Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="w-2 bg-transparent cursor-col-resize z-10 -mx-1 relative shrink-0"
        />

        {/* Right Pane: Editor + Console */}
        <section className="flex-1 flex flex-col bg-surface-raised min-w-[400px] dark:bg-black focus-mode:bg-black">
          <div className="h-10 bg-surface border-b border-line flex justify-between items-center px-4">
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
                <select
                  className="appearance-none bg-surface-raised border border-[#444] text-ink font-mono text-[0.75rem] font-semibold py-[0.35rem] pr-[1.8rem] pl-3 rounded-md outline-none cursor-pointer transition-all duration-200 shadow-sm hover:border-brand hover:bg-brand/10 focus:border-brand focus:ring-2 focus:ring-brand/20 bg-no-repeat"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'javascript' | 'typescript')}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                </select>
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

          <div className="flex-1 relative min-h-[200px]">
            <Editor
              height="100%"
              language={language}
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
      </div>
    </div>
  );
}
