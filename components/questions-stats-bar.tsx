import { Flame, Trophy, Code2, Layout, Server } from 'lucide-react';

interface CategoryStat {
  solved: number;
  total: number;
}

interface QuestionsStatsBarProps {
  isLoggedIn: boolean;
  streak: number;
  solvedCount: number;
  totalQuestions: number;
  js: CategoryStat;
  ui: CategoryStat;
  backend: CategoryStat;
  concepts: CategoryStat;
}

function MiniProgress({ solved, total, colorClass, muted }: { solved: number; total: number; colorClass: string; muted?: boolean }) {
  const pct = total > 0 ? (solved / total) * 100 : 0;
  return (
    <div className="h-1 w-full bg-bg-subtle rounded-full overflow-hidden mt-1">
      <div className={`h-full rounded-full transition-all duration-500 ease-in-out ${muted ? 'bg-muted/30' : colorClass}`} style={{ width: muted ? '0%' : `${pct}%` }} />
    </div>
  );
}

export function QuestionsStatsBar({
  isLoggedIn,
  streak,
  solvedCount,
  totalQuestions,
  js,
  ui,
  backend,
}: QuestionsStatsBarProps) {
  const dim = !isLoggedIn;

  return (
    <div className={`flex flex-wrap items-center gap-4 mb-8 ${dim ? 'opacity-40 saturate-0 pointer-events-none select-none' : ''}`}>
      {/* Hero Chip: Streak */}
      <div className="flex items-center bg-surface border border-line-soft rounded-md px-4 py-3 gap-3 shadow-sm min-w-[140px]">
        <Flame size={20} className="text-orange-500 drop-shadow-sm" style={{ animation: streak > 0 && !dim ? 'flame-flicker 2s ease-in-out infinite' : undefined }} />
        <div className="flex flex-col">
          <span className="text-ink font-semibold leading-tight">{dim ? '—' : `${streak} ${streak === 1 ? 'day' : 'days'}`}</span>
          <span className="text-muted text-[0.8rem] mt-[1px]">Streak</span>
        </div>
      </div>

      {/* Hero Chip: Solved */}
      <div className="flex items-center bg-surface border border-line-soft rounded-md px-4 py-3 gap-3 shadow-sm min-w-[140px]">
        <Trophy size={20} className="text-yellow-400 drop-shadow-sm" />
        <div className="flex flex-col">
          <span className="text-ink font-semibold leading-tight">
            {dim ? '—' : <>{solvedCount}<span className="text-muted text-[0.85em] font-medium ml-1">/{totalQuestions}</span></>}
          </span>
          <span className="text-muted text-[0.8rem] mt-[1px]">Solved</span>
        </div>
      </div>

      <div className="hidden sm:block h-10 w-px bg-line-soft mx-2" />

      {/* Category Chips */}
      {[
        { label: 'JS', icon: Code2, color: 'text-yellow-400', bar: 'bg-yellow-400', stat: js },
        { label: 'UI', icon: Layout, color: 'text-blue-400', bar: 'bg-blue-400', stat: ui },
        { label: 'Backend', icon: Server, color: 'text-green-400', bar: 'bg-green-400', stat: backend },
      ].map(({ label, icon: Icon, color, bar, stat }) => (
        <div key={label} className="flex flex-col justify-between bg-surface border border-line-soft rounded-md px-3 py-[0.6rem] gap-1.5 shadow-sm min-w-[120px] flex-1 sm:flex-none">
          <div className="flex items-center gap-1.5 w-full">
            <Icon size={14} className={color} />
            <span className="text-[0.75rem] font-medium text-ink-secondary tracking-wide uppercase">{label}</span>
            <span className="font-semibold text-[0.85rem] text-ink ml-auto">
              {dim ? '—' : <>{stat.solved}<span className="text-muted text-[0.85em] font-medium ml-[1px]">/{stat.total}</span></>}
            </span>
          </div>
          <MiniProgress solved={stat.solved} total={stat.total} colorClass={bar} muted={dim} />
        </div>
      ))}
    </div>
  );
}
