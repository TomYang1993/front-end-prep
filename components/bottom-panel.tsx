'use client';

import { ChevronDown, ChevronUp, Terminal, FlaskConical, ClipboardCheck, Trash2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useSyntaxTheme } from '@/lib/hooks/use-syntax-theme';

export type BottomTab = 'tests' | 'console' | 'results';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface SubmitResult {
  score: number;
  status: 'PASSED' | 'FAILED';
  passedCount: number;
  total: number;
  publicResults: TestResult[];
  hiddenResults: { index: number; name: string; passed: boolean; error?: string }[];
}

interface BottomPanelProps {
  activeTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
  height: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onMouseDown: (e: React.MouseEvent) => void;

  // Tests tab
  testCode: string;
  testResults: TestResult[];
  mode: 'js' | 'react';

  // Console tab (JS only)
  consoleLogs?: string[];
  onClearConsole?: () => void;

  // Results tab
  submitResult: SubmitResult | null;
  isRunning: boolean;
  isSubmitting: boolean;
}

export function BottomPanel({
  activeTab,
  onTabChange,
  height,
  collapsed,
  onToggleCollapse,
  onMouseDown,
  testCode,
  testResults,
  mode,
  consoleLogs = [],
  onClearConsole,
  submitResult,
  isRunning,
  isSubmitting,
}: BottomPanelProps) {
  const syntaxStyle = useSyntaxTheme();

  const tabs: { id: BottomTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'tests',
      label: 'Tests',
      icon: <FlaskConical size={13} />,
      badge: testResults.length > 0
        ? `${testResults.filter((r) => r.passed).length}/${testResults.length}`
        : undefined,
    },
    ...(mode === 'js'
      ? [{
          id: 'console' as const,
          label: 'Console',
          icon: <Terminal size={13} />,
          badge: consoleLogs.length > 0 ? String(consoleLogs.length) : undefined,
        }]
      : []),
    {
      id: 'results',
      label: 'Results',
      icon: <ClipboardCheck size={13} />,
      badge: submitResult
        ? `${submitResult.passedCount}/${submitResult.total}`
        : undefined,
    },
  ];

  return (
    <div className="bg-surface flex flex-col shrink-0" style={{ height }}>
      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="h-1.5 shrink-0 bg-line hover:bg-brand/50 cursor-row-resize transition-colors"
        title="Drag to resize"
      />

      {/* Tab bar */}
      <div
        className="h-10 flex items-center justify-between px-4 shrink-0 border-t border-line"
      >
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { onTabChange(tab.id); if (collapsed) onToggleCollapse(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-wider rounded-md transition-colors
                ${activeTab === tab.id && !collapsed
                  ? 'text-ink bg-bg'
                  : 'text-muted hover:text-ink hover:bg-bg-subtle/50'
                }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-sm text-[0.6rem] ${
                  activeTab === tab.id
                    ? tab.id === 'results' && submitResult
                      ? submitResult.status === 'PASSED' ? 'bg-good-subtle text-good' : 'bg-warn-subtle text-warn'
                      : testResults.length > 0 && testResults.every((r) => r.passed)
                        ? 'bg-good-subtle text-good'
                        : 'bg-warn-subtle text-warn'
                    : 'bg-surface-raised text-muted'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-muted">
          {activeTab === 'console' && consoleLogs.length > 0 && onClearConsole && (
            <button onClick={onClearConsole} className="p-1 hover:bg-line rounded-md transition-colors" title="Clear console">
              <Trash2 size={14} />
            </button>
          )}
          <button onClick={onToggleCollapse} className="p-1 hover:bg-line rounded-md transition-colors">
            {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Tab content */}
      {!collapsed && (
        <div className="flex-1 min-h-0 overflow-y-auto bg-bg">
          {activeTab === 'tests' && (
            <TestsTab testCode={testCode} testResults={testResults} syntaxStyle={syntaxStyle} isRunning={isRunning} />
          )}
          {activeTab === 'console' && (
            <ConsoleTab logs={consoleLogs} />
          )}
          {activeTab === 'results' && (
            <ResultsTab submitResult={submitResult} isSubmitting={isSubmitting} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Test block parser ───

function parseTestBlocks(code: string): { name: string; code: string }[] {
  const blocks: { name: string; code: string }[] = [];
  const lines = code.split('\n');
  let current: { name: string; startLine: number } | null = null;
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!current) {
      const match = line.match(/^(?:test|it)\s*\(\s*['"`](.+?)['"`]/);
      if (match) {
        current = { name: match[1], startLine: i };
        depth = 0;
      }
    }

    if (current) {
      for (const ch of line) {
        if (ch === '{') depth++;
        if (ch === '}') depth--;
      }

      if (depth <= 0 && line.includes('}')) {
        blocks.push({
          name: current.name,
          code: lines.slice(current.startLine, i + 1).join('\n').trim(),
        });
        current = null;
      }
    }
  }

  if (current) {
    blocks.push({
      name: current.name,
      code: lines.slice(current.startLine).join('\n').trim(),
    });
  }

  return blocks;
}

/** Parse error message into structured parts */
function formatError(error: string): { type?: string; expected?: string; received?: string; message: string } {
  // Take only first line — stack traces from isolated-vm are not useful
  const message = error.split('\n')[0];

  // Match "Expected X, got Y" pattern
  const diffMatch = message.match(/^(?:(\w+Error):\s+)?Expected\s+(.+?),\s+(?:received|got)\s+(.+)$/);
  if (diffMatch) {
    return { type: diffMatch[1], expected: diffMatch[2], received: diffMatch[3], message };
  }

  // Match "ErrorType: message" pattern
  const typeMatch = message.match(/^(\w+Error):\s+(.+)$/);
  if (typeMatch) {
    return { type: typeMatch[1], message: typeMatch[2] };
  }

  return { message };
}

// ─── Tests Tab ───

function TestsTab({
  testCode,
  testResults,
  syntaxStyle,
  isRunning,
}: {
  testCode: string;
  testResults: TestResult[];
  syntaxStyle: Record<string, React.CSSProperties>;
  isRunning: boolean;
}) {
  if (!testCode) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm font-mono">
        No test code configured
      </div>
    );
  }

  const blocks = parseTestBlocks(testCode);
  const hasResults = testResults.length > 0;

  // Build a map of results by name for matching
  const resultMap = new Map<string, TestResult>();
  for (const r of testResults) resultMap.set(r.name, r);

  // Results that don't match any block (e.g. "Execution Error")
  const unmatchedResults = hasResults
    ? testResults.filter((r) => !blocks.some((b) => b.name === r.name))
    : [];

  return (
    <div className="p-3 space-y-2">
      {isRunning && (
        <div className="text-muted text-sm font-mono animate-pulse px-1 py-2">Running tests...</div>
      )}

      {/* Unmatched results (execution errors, etc.) */}
      {unmatchedResults.map((r, i) => (
        <div key={`unmatched-${i}`} className="border border-warn/40 rounded-md overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-warn-subtle/20 text-warn text-sm font-mono font-bold">
            <XIcon />
            {r.name}
          </div>
          {r.error && <ErrorDisplay error={r.error} />}
        </div>
      ))}

      {/* Test blocks with code + results */}
      {blocks.map((block, i) => {
        const result = resultMap.get(block.name);
        const status = !hasResults ? 'pending' : result?.passed ? 'passed' : 'failed';

        return (
          <div
            key={i}
            className={`rounded-md overflow-hidden border ${
              status === 'passed'
                ? 'border-good/30'
                : status === 'failed'
                  ? 'border-warn/40'
                  : 'border-line'
            }`}
          >
            {/* Header: test name + status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 text-[13px] font-mono font-bold ${
              status === 'passed'
                ? 'bg-good-subtle/20 text-good'
                : status === 'failed'
                  ? 'bg-warn-subtle/20 text-warn'
                  : 'bg-surface-raised text-ink-secondary'
            }`}>
              {status === 'passed' && <CheckIcon />}
              {status === 'failed' && <XIcon />}
              {status === 'pending' && <span className="w-3.5 h-3.5 rounded-full border-2 border-current opacity-30" />}
              <span className="truncate">{block.name}</span>
            </div>

            {/* Code block — only revealed after tests have been run */}
            {hasResults && (
              <div className="text-[12px] leading-[1.6]">
                <SyntaxHighlighter
                  language="javascript"
                  style={syntaxStyle}
                  customStyle={{ margin: 0, padding: '8px 12px', background: 'transparent' }}
                  codeTagProps={{ style: { background: 'transparent' } }}
                  showLineNumbers={false}
                >
                  {block.code}
                </SyntaxHighlighter>
              </div>
            )}

            {/* Error output */}
            {result?.error && <ErrorDisplay error={result.error} />}
          </div>
        );
      })}
    </div>
  );
}

function ErrorDisplay({ error }: { error: string }) {
  const fmt = formatError(error);

  return (
    <div className="px-3 py-2 bg-warn-subtle/10 border-t border-warn/20 font-mono text-[12px] space-y-1">
      {/* Error type badge + message */}
      <div className="flex items-start gap-2">
        {fmt.type && (
          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-warn-subtle text-warn uppercase tracking-wide">
            {fmt.type}
          </span>
        )}
        {fmt.expected ? (
          <div className="space-y-0.5">
            <div><span className="text-good font-bold">- Expected: </span><span className="text-good">{fmt.expected}</span></div>
            <div><span className="text-warn font-bold">+ Received: </span><span className="text-warn">{fmt.received}</span></div>
          </div>
        ) : (
          <span className="text-warn">{fmt.message}</span>
        )}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Console Tab ───

function ConsoleTab({ logs }: { logs: string[] }) {
  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm font-mono">
        Run your code to see output
      </div>
    );
  }

  return (
    <div className="p-4 font-mono text-[13px] text-ink-secondary space-y-0.5">
      {logs.map((line, i) => (
        <div key={i} className="py-0.5 border-b border-line/30 last:border-0">
          <span className="text-muted text-[11px] mr-3 select-none">{i + 1}</span>
          {line}
        </div>
      ))}
    </div>
  );
}

// ─── Results Tab ───

function ResultsTab({
  submitResult,
  isSubmitting,
}: {
  submitResult: SubmitResult | null;
  isSubmitting: boolean;
}) {
  if (isSubmitting) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm font-mono animate-pulse">
        Judging submission...
      </div>
    );
  }

  if (!submitResult) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm font-mono">
        Submit your code to see results
      </div>
    );
  }

  const allPassed = submitResult.status === 'PASSED';

  return (
    <div className="p-4 space-y-4">
      {/* Summary bar */}
      <div className={`text-sm font-bold flex items-center gap-2 border-b border-line pb-4 ${allPassed ? 'text-good' : 'text-warn'}`}>
        <span className={`w-2 h-2 rounded-full ${allPassed ? 'bg-good' : 'bg-warn'}`}></span>
        {submitResult.passedCount} / {submitResult.total} Tests Passed
        <span className="text-muted font-normal ml-2">({submitResult.score}%)</span>
      </div>

      {/* Public test results */}
      {submitResult.publicResults.length > 0 && (
        <div>
          <h4 className="text-[0.7rem] uppercase tracking-wider text-muted font-bold mb-2">Public Tests</h4>
          <div className="space-y-2">
            {submitResult.publicResults.map((r, i) => (
              <TestResultRow key={i} name={r.name} passed={r.passed} error={r.error} />
            ))}
          </div>
        </div>
      )}

      {/* Hidden test results */}
      {submitResult.hiddenResults.length > 0 && (
        <div>
          <h4 className="text-[0.7rem] uppercase tracking-wider text-muted font-bold mb-2">Hidden Tests</h4>
          <div className="space-y-2">
            {submitResult.hiddenResults.map((r) => (
              <TestResultRow key={r.index} name={r.name} passed={r.passed} error={r.error} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TestResultRow({ name, passed, error }: { name: string; passed: boolean; error?: string }) {
  return (
    <div className={`rounded-md overflow-hidden border ${passed ? 'border-good/30' : 'border-warn/40'}`}>
      <div className={`flex items-center gap-2 px-3 py-2 text-sm font-mono font-bold ${
        passed ? 'bg-good-subtle/20 text-good' : 'bg-warn-subtle/20 text-warn'
      }`}>
        {passed ? <CheckIcon /> : <XIcon />}
        <span className="truncate">{name}</span>
      </div>
      {error && <ErrorDisplay error={error} />}
    </div>
  );
}
