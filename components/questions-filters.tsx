'use client';

import { ChevronDown } from 'lucide-react';

const selectClass =
  'appearance-none bg-surface-raised border border-line text-ink text-xs font-semibold py-[0.35rem] pr-7 pl-3 rounded-md outline-none cursor-pointer transition-all duration-200 shadow-sm hover:border-brand hover:bg-brand/10 focus:border-brand focus:ring-2 focus:ring-brand/20';

interface QuestionsFiltersProps {
  type: string;
  difficulty: string;
  status: string;
  onChange: (key: 'type' | 'difficulty' | 'status', value: string) => void;
}

export function QuestionsFilters({ type, difficulty, status, onChange }: QuestionsFiltersProps) {
  return (
    <>
      <div className="relative">
        <select
          className={selectClass}
          value={type}
          onChange={(e) => onChange('type', e.target.value)}
        >
          <option value="">Category: All</option>
          <option value="REACT_APP">UI</option>
          <option value="FUNCTION_JS">JS/TS Logic</option>
          <option value="FUNCTION_PYTHON">Backend</option>
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted" />
      </div>

      <div className="relative">
        <select
          className={selectClass}
          value={difficulty}
          onChange={(e) => onChange('difficulty', e.target.value)}
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
          value={status}
          onChange={(e) => onChange('status', e.target.value)}
        >
          <option value="">Status: All</option>
          <option value="solved">Completed</option>
          <option value="attempted">Attempted</option>
          <option value="unattempted">Not Started</option>
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted" />
      </div>
    </>
  );
}
