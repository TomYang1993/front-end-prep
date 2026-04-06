import { Flame, Trophy, Code2, Layout, Server, BookOpen } from 'lucide-react';

interface CategoryStat {
  solved: number;
  total: number;
}

interface QuestionsStatsBarProps {
  solvedCount: number;
  totalQuestions: number;
  js: CategoryStat;
  ui: CategoryStat;
  backend: CategoryStat;
  concepts: CategoryStat;
}

function MiniProgress({ solved, total, colorClass }: { solved: number; total: number; colorClass: string }) {
  const pct = total > 0 ? (solved / total) * 100 : 0;
  return (
    <div className="h-1 w-full bg-bg-subtle rounded-full overflow-hidden mt-1">
      <div className={`h-full rounded-full transition-all duration-500 ease-in-out ${colorClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function QuestionsStatsBar({
  solvedCount,
  totalQuestions,
  js,
  ui,
  backend,
  concepts,
}: QuestionsStatsBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-8">
      {/* Hero Chip: Streak */}
      <div className="flex items-center bg-surface border border-line-soft rounded-md px-4 py-3 gap-3 shadow-sm min-w-[140px]">
        <Flame size={20} className="text-orange-500 drop-shadow-sm" />
        <div className="flex flex-col">
          <span className="text-ink font-semibold leading-tight">1 day</span>
          <span className="text-muted text-[0.8rem] mt-[1px]">Streak</span>
        </div>
      </div>

      {/* Hero Chip: Solved */}
      <div className="flex items-center bg-surface border border-line-soft rounded-md px-4 py-3 gap-3 shadow-sm min-w-[140px]">
        <Trophy size={20} className="text-yellow-400 drop-shadow-sm" />
        <div className="flex flex-col">
          <span className="text-ink font-semibold leading-tight">
            {solvedCount}<span className="text-muted text-[0.85em] font-medium ml-1">/{totalQuestions}</span>
          </span>
          <span className="text-muted text-[0.8rem] mt-[1px]">Solved</span>
        </div>
      </div>

      <div className="hidden sm:block h-10 w-px bg-line-soft mx-2" />

      {/* Category Chips */}
      <div className="flex flex-col justify-between bg-surface border border-line-soft rounded-md px-3 py-[0.6rem] gap-1.5 shadow-sm min-w-[120px] flex-1 sm:flex-none">
        <div className="flex items-center gap-1.5 w-full">
          <Code2 size={14} className="text-yellow-400" />
          <span className="text-[0.75rem] font-medium text-ink-secondary tracking-wide uppercase">JS</span>
          <span className="font-semibold text-[0.85rem] text-ink ml-auto">
            {js.solved}<span className="text-muted text-[0.85em] font-medium ml-[1px]">/{js.total}</span>
          </span>
        </div>
        <MiniProgress solved={js.solved} total={js.total} colorClass="bg-yellow-400" />
      </div>

      <div className="flex flex-col justify-between bg-surface border border-line-soft rounded-md px-3 py-[0.6rem] gap-1.5 shadow-sm min-w-[120px] flex-1 sm:flex-none">
        <div className="flex items-center gap-1.5 w-full">
          <Layout size={14} className="text-blue-400" />
          <span className="text-[0.75rem] font-medium text-ink-secondary tracking-wide uppercase">UI</span>
          <span className="font-semibold text-[0.85rem] text-ink ml-auto">
            {ui.solved}<span className="text-muted text-[0.85em] font-medium ml-[1px]">/{ui.total}</span>
          </span>
        </div>
        <MiniProgress solved={ui.solved} total={ui.total} colorClass="bg-blue-400" />
      </div>

      <div className="flex flex-col justify-between bg-surface border border-line-soft rounded-md px-3 py-[0.6rem] gap-1.5 shadow-sm min-w-[120px] flex-1 sm:flex-none">
        <div className="flex items-center gap-1.5 w-full">
          <Server size={14} className="text-green-400" />
          <span className="text-[0.75rem] font-medium text-ink-secondary tracking-wide uppercase">Backend</span>
          <span className="font-semibold text-[0.85rem] text-ink ml-auto">
            {backend.solved}<span className="text-muted text-[0.85em] font-medium ml-[1px]">/{backend.total}</span>
          </span>
        </div>
        <MiniProgress solved={backend.solved} total={backend.total} colorClass="bg-green-400" />
      </div>

      <div className="flex flex-col justify-between bg-surface border border-line-soft rounded-md px-3 py-[0.6rem] gap-1.5 shadow-sm min-w-[120px] flex-1 sm:flex-none">
        <div className="flex items-center gap-1.5 w-full">
          <BookOpen size={14} className="text-purple-400" />
          <span className="text-[0.75rem] font-medium text-ink-secondary tracking-wide uppercase">Concepts</span>
          <span className="font-semibold text-[0.85rem] text-ink ml-auto">
            {concepts.solved}<span className="text-muted text-[0.85em] font-medium ml-[1px]">/{concepts.total}</span>
          </span>
        </div>
        <MiniProgress solved={concepts.solved} total={concepts.total} colorClass="bg-purple-400" />
      </div>
    </div>
  );
}
