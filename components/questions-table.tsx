import Link from 'next/link';
import clsx from 'clsx';
import { DIFFICULTY_LABEL } from '@/types/domain';
import { Award, Lock, ChevronLeft, ChevronRight } from 'lucide-react';

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
  /** Number of successful (PASSED) submissions */
  passedCount: number;
}

interface QuestionsTableProps {
  questions: QuestionRow[];
  isLoggedIn: boolean;
  page: number;
  totalPages: number;
  totalFiltered: number;
  searchParams: Record<string, string>;
}

function pageHref(params: Record<string, string>, page: number) {
  const p = new URLSearchParams(params);
  if (page > 1) p.set('page', String(page));
  const qs = p.toString();
  return `/questions${qs ? `?${qs}` : ''}`;
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, '...', total];
  if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export function QuestionsTable({ questions, isLoggedIn, page, totalPages, totalFiltered, searchParams }: QuestionsTableProps) {
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
              <td className="w-[65px] pr-0 py-4 text-center align-middle">
                {isLoggedIn ? (
                  <div className="flex items-center justify-center">
                    {q.status === 'solved' ? (
                      q.passedCount >= 2 ? (
                        <div className="inline-flex items-center" title={`Solved ${q.passedCount} times`}>
                          <Award size={18} strokeWidth={2} className="text-good drop-shadow-[0_0_3px_var(--good-subtle)] -mr-[7px] relative z-10" />
                          <Award size={18} strokeWidth={2} className="text-good/85 drop-shadow-[0_0_3px_var(--good-subtle)]" />
                        </div>
                      ) : (
                        <span title="Solved">
                          <Award size={20} strokeWidth={2} className="text-good drop-shadow-[0_0_3px_var(--good-subtle)]" />
                        </span>
                      )
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-muted/45" aria-label={q.status === 'attempted' ? 'In progress' : 'Not started'}>
                        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1.5 2.75" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                ) : (
                  <span className="text-muted/40 text-sm font-medium">—</span>
                )}
              </td>

              {/* Title + tags + attempts */}
              <td className="pl-2 py-4 align-top pr-4">
                <div className="flex flex-col gap-2">
                  <Link href={`/questions/${q.slug}`} className="font-semibold text-ink group-hover:text-brand text-[0.95rem] transition-colors flex items-center gap-2">
                    {q.title}
                    {q.locked && <span className="inline-flex items-center gap-[2px] bg-amber-100 text-amber-700 border border-amber-200 px-[6px] py-[1px] rounded-md text-[10px] uppercase font-bold tracking-wider ml-1 drop-shadow-sm"><Lock size={10} className="-mt-[1px]" /> Pro</span>}
                  </Link>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] px-2 py-[2px] bg-brand-subtle text-brand rounded shadow-sm border border-brand/20 uppercase font-bold tracking-wider">{q.type === 'REACT_APP' ? 'React' : q.type === 'FUNCTION_PYTHON' ? 'Python' : 'JS'}</span>
                  </div>
                </div>
              </td>

              {/* Description */}
              <td className="hidden sm:table-cell py-4 pr-6 align-top">
                <span className="text-[0.88rem] text-muted leading-relaxed line-clamp-2">{q.description}</span>
              </td>

              {/* Difficulty */}
              <td className="py-4 align-top text-center">
                <span className={clsx('inline-flex items-center justify-center px-2 py-[0.3rem] rounded-sm text-[0.65rem] font-bold uppercase tracking-[0.05em] leading-none', q.difficulty.toLowerCase() === 'easy' ? 'bg-good-subtle text-good' : q.difficulty.toLowerCase() === 'medium' ? 'bg-caution-subtle text-caution' : 'bg-warn-subtle text-warn')}>
                  {DIFFICULTY_LABEL[q.difficulty] ?? q.difficulty}
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
          {totalPages > 1
            ? `Showing ${(page - 1) * 25 + 1}–${Math.min(page * 25, totalFiltered)} of ${totalFiltered}`
            : `Showing ${totalFiltered} question${totalFiltered !== 1 ? 's' : ''}`}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            {page > 1 ? (
              <Link href={pageHref(searchParams, page - 1)} className="h-8 w-8 flex items-center justify-center rounded-md border border-line bg-surface text-ink text-sm font-medium hover:bg-line-soft transition-colors shadow-sm">
                <ChevronLeft size={16} />
              </Link>
            ) : (
              <span className="h-8 w-8 flex items-center justify-center rounded-md border border-line bg-surface text-ink text-sm font-medium opacity-40 shadow-sm">
                <ChevronLeft size={16} />
              </span>
            )}
            {getPageNumbers(page, totalPages).map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="h-8 min-w-[32px] px-1 flex items-center justify-center text-muted text-sm">…</span>
              ) : (
                <Link
                  key={p}
                  href={pageHref(searchParams, p)}
                  className={clsx(
                    'h-8 min-w-[32px] px-2 flex items-center justify-center rounded-md text-sm font-semibold transition-colors shadow-sm',
                    p === page
                      ? 'border border-brand bg-brand text-white'
                      : 'border border-line bg-surface text-ink hover:bg-line-soft'
                  )}
                >
                  {p}
                </Link>
              )
            )}
            {page < totalPages ? (
              <Link href={pageHref(searchParams, page + 1)} className="h-8 w-8 flex items-center justify-center rounded-md border border-line bg-surface text-ink text-sm font-medium hover:bg-line-soft transition-colors shadow-sm">
                <ChevronRight size={16} />
              </Link>
            ) : (
              <span className="h-8 w-8 flex items-center justify-center rounded-md border border-line bg-surface text-ink text-sm font-medium opacity-40 shadow-sm">
                <ChevronRight size={16} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
