'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';

const selectClass =
  'appearance-none bg-surface-raised border border-line text-ink text-xs font-semibold py-[0.35rem] pr-7 pl-3 rounded-md outline-none cursor-pointer transition-all duration-200 shadow-sm hover:border-brand hover:bg-brand/10 focus:border-brand focus:ring-2 focus:ring-brand/20';

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
        params.delete('page');
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
    params.delete('page');
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
      <div className="relative">
        <select
          className={selectClass}
          value={searchParams.get('type') || ''}
          onChange={(e) => updateParam('type', e.target.value)}
        >
          <option value="">Category: All</option>
          <option value="REACT_APP">React UI</option>
          <option value="FUNCTION_JS">JS/TS Logic</option>
          <option value="FUNCTION_PYTHON">Backend</option>
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted" />
      </div>

      <div className="relative">
        <select
          className={selectClass}
          value={searchParams.get('difficulty') || ''}
          onChange={(e) => updateParam('difficulty', e.target.value)}
        >
          <option value="">Difficulty: All</option>
          <option value="EASY">Entry</option>
          <option value="MEDIUM">Mid</option>
          <option value="HARD">Senior+</option>
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted" />
      </div>

      <div className="relative">
        <select
          className={selectClass}
          value={searchParams.get('status') || ''}
          onChange={(e) => updateParam('status', e.target.value)}
        >
          <option value="">Status: All</option>
          <option value="solved">Completed</option>
          <option value="attempted">Attempted</option>
          <option value="unattempted">Not Started</option>
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted" />
      </div>
    </div>
  );
}
