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
    <div className="flex items-center gap-3 flex-nowrap w-full">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-[289px]">
        <Search size={16} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search questions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full py-2 pl-[2.2rem] pr-4 rounded-sm border border-line bg-surface text-ink text-[0.88rem] outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>

      <span className="mx-2 text-line">|</span>
      <span className="flex items-center text-muted"><SlidersHorizontal size={18} /></span>

      {/* Dropdowns */}
      <select
        className="ide-lang-select px-[0.8rem] py-[0.5rem] rounded-sm border border-line bg-surface text-ink text-[0.85rem] outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
        value={searchParams.get('type') || ''}
        onChange={(e) => updateParam('type', e.target.value)}
      >
        <option value="">Category: All</option>
        <option value="REACT_APP">React UI</option>
        <option value="FUNCTION_JS">JS/TS Logic</option>
        <option value="concepts">FE Concepts</option>
        <option value="system">System Design</option>
        <option value="performance">Performance</option>
      </select>

      <select
        className="ide-lang-select px-[0.8rem] py-[0.5rem] rounded-sm border border-line bg-surface text-ink text-[0.85rem] outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
        value={searchParams.get('difficulty') || ''}
        onChange={(e) => updateParam('difficulty', e.target.value)}
      >
        <option value="">Difficulty: All</option>
        <option value="EASY">Easy</option>
        <option value="MEDIUM">Medium</option>
        <option value="HARD">Hard</option>
      </select>

      <select
        className="ide-lang-select px-[0.8rem] py-[0.5rem] rounded-sm border border-line bg-surface text-ink text-[0.85rem] outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
        value={searchParams.get('status') || ''}
        onChange={(e) => updateParam('status', e.target.value)}
      >
        <option value="">Status: All</option>
        <option value="solved">Completed</option>
        <option value="attempted">Attempted</option>
        <option value="unattempted">Not Started</option>
      </select>
    </div>
  );
}
