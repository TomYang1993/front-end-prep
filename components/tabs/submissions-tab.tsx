'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useFetch } from '@/lib/hooks/use-fetch';
import { useSyntaxTheme } from '@/lib/hooks/use-syntax-theme';

export interface SubmissionRow {
  id: string;
  status: string;
  score: number | null;
  framework: string;
  code: string;
  createdAt: string;
}

interface SubmissionsTabProps {
  questionId: string;
}

function frameworkLanguage(framework: string) {
  if (framework === 'typescript') return 'typescript';
  if (framework === 'python') return 'python';
  return 'javascript';
}

export function SubmissionsTab({ questionId }: SubmissionsTabProps) {
  const syntaxTheme = useSyntaxTheme();
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, loading, error } = useFetch<SubmissionRow[]>(`/api/questions/${questionId}/submissions`);

  if (loading) {
    return <p className="text-muted text-center py-8">Loading submissions...</p>;
  }
  if (error) {
    return <p className="text-muted text-center py-8">Couldn&apos;t load submissions. Try again.</p>;
  }
  const submissions = Array.isArray(data) ? data : [];
  if (submissions.length === 0) {
    return <p className="text-muted text-center py-8">No submissions yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {submissions.map((sub) => {
        const isExpanded = expanded === sub.id;
        const passed = sub.status === 'PASSED';
        const lang = frameworkLanguage(sub.framework);
        return (
          <div key={sub.id} className="border border-line rounded-md overflow-hidden">
            <button
              onClick={() => setExpanded(isExpanded ? null : sub.id)}
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
      })}
    </div>
  );
}
