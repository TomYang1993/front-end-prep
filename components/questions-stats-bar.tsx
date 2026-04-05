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

function MiniProgress({ solved, total, color }: { solved: number; total: number; color: string }) {
  const pct = total > 0 ? (solved / total) * 100 : 0;
  return (
    <div className="stats-mini-progress">
      <div className="stats-mini-progress-fill" style={{ width: `${pct}%`, background: color }} />
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
    <div className="stats-bar">
      <div className="stats-bar-chip stats-bar-hero">
        <Flame size={20} className="stats-bar-icon streak stats-bar-icon-glow" />
        <div className="stats-bar-hero-text">
          <span className="stats-bar-hero-value">1 day</span>
          <span className="stats-bar-hero-label">Streak</span>
        </div>
      </div>

      <div className="stats-bar-chip stats-bar-hero">
        <Trophy size={20} className="stats-bar-icon solved" />
        <div className="stats-bar-hero-text">
          <span className="stats-bar-hero-value">{solvedCount}<span className="stats-bar-total">/{totalQuestions}</span></span>
          <span className="stats-bar-hero-label">Solved</span>
        </div>
      </div>

      <div className="stats-bar-divider" />

      <div className="stats-bar-chip stats-bar-chip-category">
        <div className="stats-bar-chip-top">
          <Code2 size={14} style={{ color: '#facc15' }} />
          <span className="stats-bar-label">JS</span>
          <span className="stats-bar-value">{js.solved}<span className="stats-bar-total">/{js.total}</span></span>
        </div>
        <MiniProgress solved={js.solved} total={js.total} color="#facc15" />
      </div>

      <div className="stats-bar-chip stats-bar-chip-category">
        <div className="stats-bar-chip-top">
          <Layout size={14} style={{ color: '#60a5fa' }} />
          <span className="stats-bar-label">UI</span>
          <span className="stats-bar-value">{ui.solved}<span className="stats-bar-total">/{ui.total}</span></span>
        </div>
        <MiniProgress solved={ui.solved} total={ui.total} color="#60a5fa" />
      </div>

      <div className="stats-bar-chip stats-bar-chip-category">
        <div className="stats-bar-chip-top">
          <Server size={14} style={{ color: '#4ade80' }} />
          <span className="stats-bar-label">Backend</span>
          <span className="stats-bar-value">{backend.solved}<span className="stats-bar-total">/{backend.total}</span></span>
        </div>
        <MiniProgress solved={backend.solved} total={backend.total} color="#4ade80" />
      </div>

      <div className="stats-bar-chip stats-bar-chip-category">
        <div className="stats-bar-chip-top">
          <BookOpen size={14} style={{ color: '#c084fc' }} />
          <span className="stats-bar-label">Concepts</span>
          <span className="stats-bar-value">{concepts.solved}<span className="stats-bar-total">/{concepts.total}</span></span>
        </div>
        <MiniProgress solved={concepts.solved} total={concepts.total} color="#c084fc" />
      </div>
    </div>
  );
}
