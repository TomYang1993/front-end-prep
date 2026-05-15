'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor as monacoEditor } from 'monaco-editor';
import { SandpackProvider, SandpackPreview, SandpackLayout, useSandpackNavigation } from '@codesandbox/sandpack-react';
import { useToast } from '@/components/toast-provider';
import {
  Lightbulb, FileCode2,
  Upload, ArrowLeft, Eye, Palette, History, RotateCw
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { CheatsheetModal } from '@/components/cheatsheet-modal';
import { CountdownTimer } from '@/components/countdown-timer';
import { DIFFICULTY_LABEL, DIFFICULTY_BADGE_CLASS } from '@/types/domain';
import { BottomPanel, type BottomTab, type SubmitResult } from '@/components/bottom-panel';
import { DescriptionTab } from '@/components/tabs/description-tab';
import { SolutionsTab } from '@/components/tabs/solutions-tab';
import { SubmissionsTab } from '@/components/tabs/submissions-tab';

export interface ReactEditorWorkspaceProps {
  questionId: string;
  slug: string;
  title: string;
  prompt: string;
  difficulty: string;
  tags: string[];
  starterCode?: Record<string, string>;
  expiresAt?: string;
  language: 'js' | 'ts';
}

type ActiveFile = 'app' | 'styles';
type LeftTab = 'description' | 'solutions' | 'submissions';

const leftTabBtn = 'py-2 text-[0.75rem] font-bold uppercase tracking-[0.05em] bg-transparent border-none border-b-2 border-transparent text-muted cursor-pointer transition-all duration-200 hover:text-ink [&.active]:text-ink [&.active]:border-brand';
const fileTabBtn = 'font-mono text-[0.75rem] font-bold text-muted h-full flex items-center px-4 bg-transparent border-none border-b-2 border-transparent cursor-pointer transition-colors duration-200 hover:text-ink-secondary [&.active]:text-brand [&.active]:border-brand';

const DEFAULT_APP_JS = `import React from 'react';

export default function App() {
  return <div>Start building your component.</div>;
}`;

const DEFAULT_APP_TS = `import React from 'react';

export default function App(): JSX.Element {
  return <div>Start building your component.</div>;
}`;

const DEFAULT_CSS = `/* Write your component styles here */
`;

export function ReactEditorWorkspace({
  questionId,
  slug,
  title,
  prompt,
  difficulty,
  tags,
  starterCode,
  expiresAt,
  language,
}: ReactEditorWorkspaceProps) {
  const { toast } = useToast();
  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>('description');

  const [activeFile, setActiveFile] = useState<ActiveFile>('app');
  const [codes, setCodes] = useState({
    appJs: starterCode?.react ?? DEFAULT_APP_JS,
    appTs: starterCode?.reactTypescript ?? starterCode?.react ?? DEFAULT_APP_TS,
    styles: starterCode?.css ?? DEFAULT_CSS,
  });

  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
  const appKey = language === 'ts' ? 'appTs' : 'appJs';
  const code = activeFile === 'app' ? codes[appKey] : codes.styles;
  const setCode = (val: string) => {
    setCodes((prev) => ({ ...prev, [activeFile === 'app' ? appKey : 'styles']: val }));
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
      const currentKey = activeFile === 'app' ? appKey : 'styles';
      const payload = { ...codes, [currentKey]: currentCode };
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
  }, [questionId, codes, activeFile, appKey]);

  // ─── Results state ───
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('results');

  // ─── Bottom panel resize ───
  const COLLAPSED_CONSOLE_HEIGHT = 46;
  const [consoleHeight, setConsoleHeight] = useState(COLLAPSED_CONSOLE_HEIGHT);
  const consoleHeightRef = useRef(COLLAPSED_CONSOLE_HEIGHT);
  const lastOpenConsoleHeightRef = useRef(280);
  const consoleDragStart = useRef<{ y: number; h: number } | null>(null);
  const isConsoleCollapsed = consoleHeight < 80;

  useEffect(() => {
    consoleHeightRef.current = consoleHeight;
  }, [consoleHeight]);

  const [monacoTheme, setMonacoTheme] = useState<'vs-dark' | 'light'>('vs-dark');

  // ─── Drag handles ───
  const [leftWidth, setLeftWidth] = useState(450);
  const [previewWidth, setPreviewWidth] = useState(420);
  const isDragging = useRef(false);
  const isPreviewDragging = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const newWidth = Math.max(300, Math.min(e.clientX - 65, window.innerWidth * 0.7));
        setLeftWidth(newWidth);
      }
      if (isPreviewDragging.current) {
        const newWidth = Math.max(200, Math.min(window.innerWidth - e.clientX, window.innerWidth * 0.6));
        setPreviewWidth(newWidth);
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
      if (isPreviewDragging.current) {
        isPreviewDragging.current = false;
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

  const handlePreviewMouseDown = () => {
    isPreviewDragging.current = true;
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
      const key = activeFile === 'app' ? appKey : 'styles';
      editorRef.current.setValue(codes[key]);
      prevFileRef.current = activeFile;
    }
  }, [activeFile, codes, appKey]);

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

  // Build Sandpack files — swap template + filename based on language
  const sandpackTemplate = language === 'ts' ? 'react-ts' : 'react';
  const sandpackFiles = useMemo((): Record<string, string> => (
    language === 'ts'
      ? { '/App.tsx': codes.appTs, '/styles.css': codes.styles }
      : { '/App.js': codes.appJs, '/styles.css': codes.styles }
  ), [language, codes.appJs, codes.appTs, codes.styles]);

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
          code: JSON.stringify({ app: codes[appKey], styles: codes.styles }),
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

  const editorLanguage = activeFile === 'app'
    ? (language === 'ts' ? 'typescript' : 'javascript')
    : 'css';

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
                <span className={`inline-flex items-center justify-center px-2 py-[0.3rem] rounded-sm text-[0.65rem] font-bold uppercase tracking-[0.05em] leading-none ${DIFFICULTY_BADGE_CLASS[difficulty] ?? ''}`}>{DIFFICULTY_LABEL[difficulty] ?? difficulty}</span>
              </div>
              {expiresAt && <CountdownTimer expiresAt={expiresAt} slug={slug} />}
            </div>
            <div className="flex gap-6">
              <button
                className={`${leftTabBtn} ${activeLeftTab === 'description' ? 'active' : ''}`}
                onClick={() => setActiveLeftTab('description')}
              >Description</button>
              <button
                className={`${leftTabBtn} ${activeLeftTab === 'solutions' ? 'active' : ''}`}
                onClick={() => setActiveLeftTab('solutions')}
              ><Lightbulb size={16} className="inline-block mr-1" /> Solutions</button>
              <button
                className={`${leftTabBtn} ${activeLeftTab === 'submissions' ? 'active' : ''}`}
                onClick={() => setActiveLeftTab('submissions')}
              ><History size={16} className="inline-block mr-1" /> Submissions</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeLeftTab === 'description' && <DescriptionTab prompt={prompt} tags={tags} />}
            {activeLeftTab === 'solutions' && <SolutionsTab questionId={questionId} />}
            {activeLeftTab === 'submissions' && <SubmissionsTab questionId={questionId} />}
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
            <div className="flex items-center h-full gap-2">
              <button
                className={`${fileTabBtn} ${activeFile === 'app' ? 'active' : ''}`}
                onClick={() => setActiveFile('app')}
              >
                <FileCode2 size={16} className="inline-block mr-1" /> {language === 'ts' ? 'App.tsx' : 'App.jsx'}
              </button>
              <button
                className={`${fileTabBtn} ${activeFile === 'styles' ? 'active' : ''}`}
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

        {/* Preview Drag Handle */}
        <div
          onMouseDown={handlePreviewMouseDown}
          className="w-2 bg-transparent cursor-col-resize z-10 -mx-1 relative shrink-0"
        />

        {/* Preview Column */}
        <section className="flex flex-col border-l border-line min-w-[200px] flex-none" style={{ width: previewWidth }}>
          <SandpackProvider
            template={sandpackTemplate}
            files={sandpackFiles}
            style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}
          >
            <div className="h-10 bg-surface border-b border-line flex items-center justify-between px-4 shrink-0">
              <span className="text-[0.75rem] font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                <Eye size={16} /> Preview
              </span>
              <PreviewRefreshButton />
            </div>
            <div className="flex-1 bg-[#f9fafb] dark:bg-white overflow-hidden min-h-0 [&_.sp-layout]:!h-full [&_.sp-layout]:!border-none [&_.sp-preview]:!h-full">
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


