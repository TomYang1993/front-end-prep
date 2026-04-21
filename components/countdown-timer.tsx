'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(diff);
      if (diff <= 0) {
        router.replace('/questions');
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, router]);

  const isWarning = remaining <= 300 && remaining > 60;
  const isCritical = remaining <= 60;

  const colorClass = isCritical
    ? 'text-warn'
    : isWarning
      ? 'text-caution'
      : 'text-muted';

  return (
    <div
      className={`flex items-center gap-1.5 font-mono text-sm tabular-nums ${mounted ? colorClass : 'text-muted'} ${isCritical && mounted ? 'animate-pulse' : ''}`}
      title="Time remaining"
    >
      <Clock size={14} />
      <span>{mounted ? formatTime(remaining) : '--:--'}</span>
    </div>
  );
}
