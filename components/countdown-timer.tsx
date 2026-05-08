'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string;
  slug: string;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function CountdownTimer({ expiresAt, slug }: CountdownTimerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(diff);
      if (diff <= 0) {
        // Only kick if user is still on this question's page. Prevents a
        // stale interval from a previous question redirecting the user
        // away from a different question they're now working on.
        if (pathname === `/questions/${slug}`) {
          router.replace('/questions');
        }
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, slug, pathname, router]);

  if (remaining === null) {
    return (
      <div className="flex items-center gap-1.5 font-mono text-sm tabular-nums text-muted" title="Time remaining">
        <Clock size={14} />
        <span>--:--</span>
      </div>
    );
  }

  const isCritical = remaining <= 60;
  const isWarning = !isCritical && remaining <= 300;
  const colorClass = isCritical ? 'text-warn' : isWarning ? 'text-caution' : 'text-muted';

  return (
    <div
      className={`flex items-center gap-1.5 font-mono text-sm tabular-nums ${colorClass} ${isCritical ? 'animate-pulse' : ''}`}
      title="Time remaining"
    >
      <Clock size={14} />
      <span>{formatTime(remaining)}</span>
    </div>
  );
}
