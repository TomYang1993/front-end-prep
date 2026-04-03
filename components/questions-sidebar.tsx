import Link from 'next/link';
import { Star, Bookmark } from 'lucide-react';


const COLLECTIONS = [
  { href: '/questions?list=top-10', label: '10 Most Liked', icon: Star },
  { href: '/questions?list=entry-10', label: 'Entry level 10', icon: Bookmark },
  { href: '/questions?list=mid-10', label: 'Mid level 10', icon: Bookmark },
  { href: '/questions?list=senior-10', label: 'Senior level 10', icon: Bookmark },
  { href: '/questions?list=staff-10', label: 'Staff level 10', icon: Bookmark },
];

export function QuestionsSidebar() {
  return (
    <aside className="questions-sidebar flex flex-col gap-6">

      <nav className="flex flex-col gap-1">
        <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2 ml-2">Featured Collections</div>
        {COLLECTIONS.map((col) => {
          const Icon = col.icon;
          return (
            <Link key={col.href} href={col.href} className="sidebar-link">
              <span className="sidebar-link-icon"><Icon size={18} /></span>
              <span>{col.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
