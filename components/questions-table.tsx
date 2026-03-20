import Link from 'next/link';
import clsx from 'clsx';

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
  /** Pseudo acceptance rate (0–100) */
  acceptance: number;
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
            <th className="col-acceptance">Pass Rate</th>
            <th className="col-action">Action</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id} className={clsx(q.locked && 'question-row-locked')}>
              {/* Status */}
              <td>
                <div className={clsx('status-icon', q.status)}>
                  {q.status === 'solved' && '✓'}
                  {q.status === 'attempted' && '!'}
                  {q.status === 'unattempted' && '—'}
                </div>
              </td>

              {/* Title + tags */}
              <td>
                <div className="question-title-cell">
                  <Link href={`/questions/${q.slug}`} className="question-title-link">
                    {q.title}
                    {q.locked && <span className="lock-chip" style={{ marginLeft: '0.5rem' }}>🔒 Pro</span>}
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

              {/* Acceptance */}
              <td className="acceptance-cell">
                {q.acceptance.toFixed(1)}%
              </td>

              {/* Action */}
              <td style={{ textAlign: 'right' }}>
                <Link href={`/questions/${q.slug}`} className="action-btn" title="Open problem">
                  ▶
                </Link>
              </td>
            </tr>
          ))}

          {questions.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
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
          <button className="pagination-btn nav-arrow" disabled>◀</button>
          <button className="pagination-btn active">1</button>
          <button className="pagination-btn nav-arrow" disabled>▶</button>
        </div>
      </div>
    </div>
  );
}
