import Link from 'next/link';
import { Monitor, ArrowLeft } from 'lucide-react';

interface DesktopOnlyGateProps {
  children: React.ReactNode;
  /** Optional title shown on the mobile prompt so users know which question they opened. */
  title?: string;
  /** Optional metadata node (difficulty, time, tags) rendered under the title on mobile. */
  meta?: React.ReactNode;
}

/**
 * Renders {children} only on md+ screens. On phones it shows an on-brand prompt
 * steering users to desktop instead of cramming the code workspace onto a small
 * screen. CSS-only — the workspace still mounts while hidden, which keeps the
 * negative-margin breakout layout intact (display:contents preserves it).
 */
export function DesktopOnlyGate({ children, title, meta }: DesktopOnlyGateProps) {
  return (
    <>
      <div className="hidden md:contents">{children}</div>

      <div className="md:hidden flex items-center justify-center min-h-[70vh] px-6">
        <div className="flex flex-col items-center gap-5 text-center max-w-sm">
          <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-subtle text-brand">
            <Monitor size={26} />
          </span>
          {title && <h1 className="text-xl font-bold leading-tight">{title}</h1>}
          {meta}
          <p className="text-muted text-[0.95rem] leading-relaxed">
            This editor deserves a real keyboard. Hop on a desktop to start
            solving — your progress and timer live on the server, so nothing&apos;s
            lost.
          </p>
          <Link
            href="/questions"
            className="btn btn-secondary inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to questions
          </Link>
        </div>
      </div>
    </>
  );
}
