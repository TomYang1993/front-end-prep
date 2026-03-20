'use client';

import { useSearchParams, useRouter } from 'next/navigation';

const CATEGORIES = [
  { key: '', label: 'All Problems', icon: '📋' },
  { key: 'REACT_APP', label: 'React UI', icon: '⚛️' },
  { key: 'FUNCTION_JS', label: 'JS/TS Logic', icon: '⚡' },
  { key: 'concepts', label: 'FE Concepts', icon: '🧠' },
  { key: 'system', label: 'System Design', icon: '🏗️' },
  { key: 'performance', label: 'Performance', icon: '🚀' },
];

interface QuestionsSidebarProps {
  totalQuestions: number;
  solvedCount: number;
}

export function QuestionsSidebar({ totalQuestions, solvedCount }: QuestionsSidebarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeCategory = searchParams.get('type') || '';

  function handleCategoryClick(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (key) {
      params.set('type', key);
    } else {
      params.delete('type');
    }
    router.push(`/questions?${params.toString()}`);
  }

  const progress = totalQuestions > 0 ? Math.round((solvedCount / totalQuestions) * 100) : 0;

  return (
    <aside className="questions-sidebar">
      <div className="questions-sidebar-header">
        <h2>Catalog</h2>
        <p>Front-end Mastery</p>
      </div>

      <nav>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`sidebar-link ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => handleCategoryClick(cat.key)}
          >
            <span className="sidebar-link-icon">{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-mastery">
        <div className="sidebar-mastery-header">
          <span className="sidebar-mastery-label">Mastery Goal</span>
          <span className="sidebar-mastery-count">{solvedCount}/{totalQuestions}</span>
        </div>
        <div className="sidebar-mastery-bar">
          <div className="sidebar-mastery-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </aside>
  );
}
