import Link from 'next/link';
import clsx from 'clsx';
import { Check, AlertCircle, Minus, Lock, ChevronLeft, ChevronRight } from 'lucide-react';

export interface QuestionRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: string;
  type: string;
  accessTier: string;
  tags: string[];
  locked: boolean;
  /** 'solved' | 'attempted' | 'unattempted' */
  status: string;
}

interface QuestionsTableProps {
  questions: QuestionRow[];
}

export function QuestionsTable({ questions }: QuestionsTableProps) {
  return (
    <div className="bg-surface rounded-lg border border-line shadow-sm overflow-hidden flex flex-col">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-bg-subtle text-[13px] text-muted border-b border-line uppercase tracking-wider font-semibold">
            <th className="w-[65px] pr-0 py-3 text-center">Status</th>
            <th className="w-1/4 pl-2 py-3">Challenge</th>
            <th className="hidden sm:table-cell w-auto py-3">Description</th>
            <th className="w-[100px] py-3 text-center">Difficulty</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id} className={clsx("transition-colors duration-200 border-b border-line last:border-b-0 hover:bg-bg-subtle group", q.locked && "opacity-70 grayscale-[30%]")}>
              {/* Status */}
              <td className="w-[65px] pr-0 align-top py-4 text-center">
                <div
                  className={clsx(
                    "inline-flex items-center justify-center h-6 w-6 rounded-full",
                    q.status === 'solved' ? 'text-good bg-good-subtle' : q.status === 'attempted' ? 'text-warn bg-warn-subtle' : 'text-line shadow-inner bg-bg-subtle'
                  )}
                  title={q.status === 'solved' ? 'Finished' : q.status === 'attempted' ? 'Attempted' : 'Untouched'}
                  aria-label={q.status === 'solved' ? 'Finished' : q.status === 'attempted' ? 'Attempted' : 'Untouched'}
                >
                  {q.status === 'solved' && <Check size={14} strokeWidth={3} />}
                  {q.status === 'attempted' && <AlertCircle size={14} strokeWidth={2.5} />}
                  {q.status === 'unattempted' && <Minus size={14} strokeWidth={3} />}
                </div>
              </td>

              {/* Title + tags + attempts */}
              <td className="pl-2 py-4 align-top pr-4">
                <div className="flex flex-col gap-2">
                  <Link href={`/questions/${q.slug}`} className="font-semibold text-ink group-hover:text-brand text-[0.95rem] transition-colors flex items-center gap-2">
                    {q.title}
                    {q.locked && <span className="inline-flex items-center gap-[2px] bg-amber-100 text-amber-700 border border-amber-200 px-[6px] py-[1px] rounded-md text-[10px] uppercase font-bold tracking-wider ml-1 drop-shadow-sm"><Lock size={10} className="-mt-[1px]" /> Pro</span>}
                  </Link>
                  <div className="flex flex-wrap gap-1.5">
                    {q.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-[2px] bg-surface rounded shadow-sm border border-line text-muted uppercase font-bold tracking-wider">{tag}</span>
                    ))}
                    <span className="text-[10px] px-2 py-[2px] bg-brand-subtle text-brand rounded shadow-sm border border-brand/20 uppercase font-bold tracking-wider">{q.type === 'REACT_APP' ? 'React' : 'JS'}</span>
                  </div>
                </div>
              </td>

              {/* Description */}
              <td className="hidden sm:table-cell py-4 pr-6 align-top">
                <span className="text-[0.88rem] text-muted leading-relaxed line-clamp-2">{q.description}</span>
              </td>

              {/* Difficulty */}
              <td className="py-4 align-top text-center">
                <span className={clsx('inline-flex items-center justify-center px-2 py-[0.3rem] rounded-sm text-[0.65rem] font-bold uppercase tracking-[0.05em] leading-none', q.difficulty.toLowerCase() === 'easy' ? 'bg-good-subtle text-good' : q.difficulty.toLowerCase() === 'medium' ? 'bg-accent-tertiary/12 text-accent-tertiary' : 'bg-warn-subtle text-warn')}>
                  {q.difficulty}
                </span>
              </td>
            </tr>
          ))}

          {questions.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-12 px-4 text-muted">
                No questions match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-between px-5 py-3 border-t border-line bg-bg-subtle/50 mt-auto">
        <span className="text-[0.85rem] text-muted font-medium">
          Showing {questions.length} question{questions.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-1.5">
          <button className="h-8 w-8 flex items-center justify-center rounded-md border border-line bg-surface text-ink text-sm font-medium hover:bg-line-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm" disabled><ChevronLeft size={16} /></button>
          <button className="h-8 min-w-[32px] px-2 flex items-center justify-center rounded-md border border-brand bg-brand text-white shadow-sm text-sm font-semibold transition-colors">1</button>
          <button className="h-8 w-8 flex items-center justify-center rounded-md border border-line bg-surface text-ink text-sm font-medium hover:bg-line-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm" disabled><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
