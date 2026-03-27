import Link from 'next/link';
import clsx from 'clsx';
import { Check, AlertCircle, Minus, Lock, Play, ChevronLeft, ChevronRight } from 'lucide-react';

export interface QuestionRow {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  type: string;
  accessTier: string;
  tags: string[];
  locked: boolean;
  /** 'solved' | 'attempted' | 'unattempted' */
  status: string;
  /** Pseudo completions/attempts count */
  attemptsCount: number;
}

interface QuestionsTableProps {
  questions: QuestionRow[];
}

export function QuestionsTable({ questions }: QuestionsTableProps) {
  return (
    <div className="questions-table-wrap">
      <table className="questions-table">
        <thead>
          <tr>
            <th className="col-status">Status</th>
            <th className="col-title">Challenge Title</th>
            <th className="col-difficulty">Difficulty</th>
            <th className="col-attempts" style={{ textAlign: 'right' }}>Users Attempted</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id} className={clsx(q.locked && 'question-row-locked')}>
              {/* Status */}
              <td>
                <div 
                  className={clsx('status-icon', q.status)}
                  title={q.status === 'solved' ? 'Finished' : q.status === 'attempted' ? 'Attempted' : 'Untouched'}
                  aria-label={q.status === 'solved' ? 'Finished' : q.status === 'attempted' ? 'Attempted' : 'Untouched'}
                >
                  {q.status === 'solved' && <Check size={16} />}
                  {q.status === 'attempted' && <AlertCircle size={16} />}
                  {q.status === 'unattempted' && <Minus size={16} />}
                </div>
              </td>

              {/* Title + tags */}
              <td>
                <div className="question-title-cell">
                  <Link href={`/questions/${q.slug}`} className="question-title-link flex items-center gap-2">
                    {q.title}
                    {q.locked && <span className="lock-chip inline-flex items-center gap-1"><Lock size={12} /> Pro</span>}
                  </Link>
                  <div className="question-tags-row">
                    {q.tags.map((tag) => (
                      <span key={tag} className="question-tag-chip">{tag}</span>
                    ))}
                    <span className="question-tag-chip">{q.type === 'REACT_APP' ? 'React' : 'JS'}</span>
                  </div>
                </div>
              </td>

              {/* Difficulty */}
              <td style={{ textAlign: 'center' }}>
                <span className={clsx('diff-badge', q.difficulty.toLowerCase())}>
                  {q.difficulty}
                </span>
              </td>

              {/* Attempts */}
              <td className="acceptance-cell" style={{ textAlign: 'right' }}>
                {q.attemptsCount.toLocaleString()}
              </td>
            </tr>
          ))}

          {questions.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
                No questions match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="questions-pagination">
        <span className="pagination-info">
          Showing {questions.length} question{questions.length !== 1 ? 's' : ''}
        </span>
        <div className="pagination-buttons">
          <button className="pagination-btn nav-arrow flex items-center justify-center p-2" disabled><ChevronLeft size={16} /></button>
          <button className="pagination-btn active">1</button>
          <button className="pagination-btn nav-arrow flex items-center justify-center p-2" disabled><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
