import Link from 'next/link';
import { TrendingUp, Trophy, Lightbulb, Star, Bookmark, FileCode2 } from 'lucide-react';

interface QuestionsSidebarProps {
  totalQuestions: number;
  solvedCount: number;
}

export function QuestionsSidebar({ totalQuestions, solvedCount }: QuestionsSidebarProps) {
  const progress = totalQuestions > 0 ? Math.round((solvedCount / totalQuestions) * 100) : 0;

  return (
    <aside className="questions-sidebar flex flex-col gap-6">

      <nav className="flex flex-col gap-1">
        <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2 ml-2">Featured Collections</div>
        <Link href="/questions?list=top-100" className="sidebar-link">
          <span className="sidebar-link-icon"><Star size={18} /></span>
          <span>100 Most Liked</span>
        </Link>
        <Link href="/questions?list=editors-choice" className="sidebar-link">
          <span className="sidebar-link-icon"><Bookmark size={18} /></span>
          <span>Editor's Picks</span>
        </Link>
        <Link href="/questions?list=cheatsheets" className="sidebar-link">
          <span className="sidebar-link-icon"><FileCode2 size={18} /></span>
          <span>Cheatsheets</span>
        </Link>
      </nav>

      <div className="sidebar-stats mt-4">
        <div className="sidebar-stat-item">
          <div className="sidebar-stat-left">
            <TrendingUp size={16} className="text-brand" />
            <span>Streak</span>
          </div>
          <span className="sidebar-stat-value">1 Day</span>
        </div>

        <div className="sidebar-stat-item">
          <div className="sidebar-stat-left">
            <Trophy size={16} className="text-amber-500" />
            <span>Solved</span>
          </div>
          <span className="sidebar-stat-value">{solvedCount}/{totalQuestions}</span>
        </div>

        <div className="sidebar-stat-item">
          <div className="sidebar-stat-left">
            <Lightbulb size={16} className="text-brand" />
            <span>Focus</span>
          </div>
          <span className="sidebar-stat-value">React</span>
        </div>
      </div>
    </aside>
  );
}
