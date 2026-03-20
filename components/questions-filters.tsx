'use client';

import { useSearchParams, useRouter } from 'next/navigation';

export function QuestionsFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/questions?${params.toString()}`);
  }

  return (
    <div className="questions-filters">
      <span className="filter-icon">🔧</span>

      <select
        value={searchParams.get('difficulty') || ''}
        onChange={(e) => updateParam('difficulty', e.target.value)}
      >
        <option value="">Difficulty: All</option>
        <option value="EASY">Easy</option>
        <option value="MEDIUM">Medium</option>
        <option value="HARD">Hard</option>
      </select>

      <span className="filter-divider" />

      <select
        value={searchParams.get('status') || ''}
        onChange={(e) => updateParam('status', e.target.value)}
      >
        <option value="">Status: All</option>
        <option value="solved">Completed</option>
        <option value="attempted">Attempted</option>
        <option value="unattempted">Not Started</option>
      </select>

      <span className="filter-divider" />

      <select
        value={searchParams.get('tier') || ''}
        onChange={(e) => updateParam('tier', e.target.value)}
      >
        <option value="">Access: All</option>
        <option value="FREE">Free</option>
        <option value="PREMIUM">Premium</option>
      </select>
    </div>
  );
}
