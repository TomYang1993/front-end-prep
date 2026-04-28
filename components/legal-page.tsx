import Link from 'next/link';
import type { ReactNode } from 'react';

export function LegalBreadcrumb({ current }: { current: string }) {
  return (
    <nav className="inline-flex items-center gap-1.5 text-[0.78rem] text-muted mb-5">
      <Link href="/" className="text-muted no-underline transition-colors duration-150 hover:text-brand">Home</Link>
      <span className="text-line">/</span>
      <span>{current}</span>
    </nav>
  );
}

export function LegalContact({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div className="bg-surface border border-line rounded-xl p-4 my-6 text-[0.88rem] text-ink-secondary [&_strong]:block [&_strong]:mb-1 [&_strong]:text-ink [&_strong]:font-semibold">
      <strong>{heading}</strong>
      {children}
    </div>
  );
}
