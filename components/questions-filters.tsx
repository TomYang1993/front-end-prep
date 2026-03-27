'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

export function QuestionsFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get('query') || '');

  useEffect(() => {
    const handler = setTimeout(() => {
      const currentQuery = searchParams.get('query') || '';
      if (query !== currentQuery) {
        const params = new URLSearchParams(searchParams.toString());
        if (query) params.set('query', query);
        else params.delete('query');
        router.push(`/questions?${params.toString()}`);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [query, searchParams, router]);

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
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'nowrap', width: '100%' }}>
      {/* Search Bar */}
      <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input
          type="text"
          placeholder="Search questions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem 1rem 0.5rem 2.2rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--ink)',
            fontSize: '0.88rem',
            outline: 'none',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--brand)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--line)'; }}
        />
      </div>

      <span className="filter-divider" style={{ margin: '0 0.5rem' }} />
      <span className="filter-icon" style={{ display: 'flex', alignItems: 'center' }}><SlidersHorizontal size={18} /></span>

      {/* Dropdowns replacing the old bordered wrapper styling with the ide-lang-select styling directly */}
      <select
        className="ide-lang-select"
        value={searchParams.get('type') || ''}
        onChange={(e) => updateParam('type', e.target.value)}
        style={{ padding: '0.5rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: '0.85rem' }}
      >
        <option value="">Category: All</option>
        <option value="REACT_APP">React UI</option>
        <option value="FUNCTION_JS">JS/TS Logic</option>
        <option value="concepts">FE Concepts</option>
        <option value="system">System Design</option>
        <option value="performance">Performance</option>
      </select>

      <select
        className="ide-lang-select"
        value={searchParams.get('difficulty') || ''}
        onChange={(e) => updateParam('difficulty', e.target.value)}
        style={{ padding: '0.5rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: '0.85rem' }}
      >
        <option value="">Difficulty: All</option>
        <option value="EASY">Easy</option>
        <option value="MEDIUM">Medium</option>
        <option value="HARD">Hard</option>
      </select>

      <select
        className="ide-lang-select"
        value={searchParams.get('status') || ''}
        onChange={(e) => updateParam('status', e.target.value)}
        style={{ padding: '0.5rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: '0.85rem' }}
      >
        <option value="">Status: All</option>
        <option value="solved">Completed</option>
        <option value="attempted">Attempted</option>
        <option value="unattempted">Not Started</option>
      </select>

      <select
        className="ide-lang-select"
        value={searchParams.get('tier') || ''}
        onChange={(e) => updateParam('tier', e.target.value)}
        style={{ padding: '0.5rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: '0.85rem' }}
      >
        <option value="">Access: All</option>
        <option value="FREE">Free</option>
        <option value="PREMIUM">Premium</option>
      </select>
    </div>
  );
}
