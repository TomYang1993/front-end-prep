'use client';

import { useEffect, useState } from 'react';

interface SubmissionHistoryItem {
  id: string;
  status: string;
  score: number | null;
  runtimeMs: number | null;
  framework: string;
  createdAt: string;
  question: {
    slug: string;
    title: string;
  };
  passedHidden: number;
  totalHidden: number;
}

export function SubmissionHistory() {
  const [data, setData] = useState<SubmissionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/submissions/history?limit=50', { cache: 'no-store' });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load submission history');
        }

        setData(payload.submissions || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load submission history');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return <p>Loading submission history...</p>;
  }

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  return (
    <section className="history-table-wrap">
      <table className="history-table">
        <thead>
          <tr>
            <th>Question</th>
            <th>Status</th>
            <th>Score</th>
            <th>Hidden</th>
            <th>Runtime</th>
            <th>Framework</th>
            <th>Submitted</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.question.title}</td>
              <td>{item.status}</td>
              <td>{item.score ?? '-'}</td>
              <td>
                {item.passedHidden}/{item.totalHidden}
              </td>
              <td>{item.runtimeMs ?? '-'}ms</td>
              <td>{item.framework}</td>
              <td>{new Date(item.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
