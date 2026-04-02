import { Flame, Trophy, Crosshair } from 'lucide-react';

interface QuestionsStatsBarProps {
  totalQuestions: number;
  solvedCount: number;
  attemptedCount: number;
}

export function QuestionsStatsBar({ totalQuestions, solvedCount, attemptedCount }: QuestionsStatsBarProps) {
  return (
    <div className="stats-bar">
      <div className="stats-bar-chip">
        <Flame size={14} className="stats-bar-icon streak" />
        <span className="stats-bar-label">Streak</span>
        <span className="stats-bar-value">1 day</span>
      </div>

      <div className="stats-bar-chip">
        <Trophy size={14} className="stats-bar-icon solved" />
        <span className="stats-bar-label">Solved</span>
        <span className="stats-bar-value">{solvedCount}<span className="stats-bar-total">/{totalQuestions}</span></span>
      </div>

      <div className="stats-bar-chip">
        <Crosshair size={14} className="stats-bar-icon attempted" style={{ color: 'var(--brand)' }} />
        <span className="stats-bar-label">Attempted</span>
        <span className="stats-bar-value">{attemptedCount}</span>
      </div>
    </div>
  );
}
