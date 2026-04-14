'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Play, Timer, RefreshCw } from 'lucide-react';
import { DIFFICULTY_LABEL } from '@/types/domain';

interface QuestionStartScreenProps {
  slug: string;
  title: string;
  difficulty: string;
  tags: string[];
  timeLimitMinutes: number;
}

export function QuestionStartScreen({
  slug,
  title,
  difficulty,
  tags,
  timeLimitMinutes,
}: QuestionStartScreenProps) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const diffClass = difficulty === 'EASY' ? 'easy' : difficulty === 'MEDIUM' ? 'medium' : 'hard';

  async function handleStart() {
    setStarting(true);
    try {
      const res = await fetch(`/api/questions/${slug}/timer`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start timer');
      router.refresh();
    } catch {
      setStarting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="flex flex-col items-center gap-6 max-w-md w-full px-6">
        <Link
          href="/questions"
          className="self-start text-sm text-muted hover:text-ink transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft size={16} />
          Back to questions
        </Link>

        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-bold">{title}</h1>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-sm text-[0.65rem] font-bold uppercase tracking-[0.05em] leading-none ${diffClass === 'easy'
                ? 'bg-good-subtle text-good'
                : diffClass === 'medium'
                  ? 'bg-caution-subtle text-caution'
                  : 'bg-warn-subtle text-warn'
                }`}
            >
              {DIFFICULTY_LABEL[difficulty] ?? difficulty}
            </span>
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[0.7rem] text-muted bg-surface-raised px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-lg text-muted">
          <Clock size={20} />
          <span>{timeLimitMinutes} minutes</span>
        </div>

        <div className="w-full flex flex-col gap-2.5 text-sm">
          <div className="flex items-start gap-3 rounded-lg bg-surface-raised px-4 py-3">
            <Timer size={18} className="text-caution mt-0.5 shrink-0" />
            <span className="text-muted">Timer can&apos;t be paused or modified once started</span>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-surface-raised px-4 py-3">
            <Clock size={16} className="text-caution mt-0.5 shrink-0" />
            <span className="text-muted">Countdown continues even if you close the tab</span>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-surface-raised px-4 py-3">
            <RefreshCw size={15} className="text-good mt-0.5 shrink-0" />
            <span className="text-muted">Timer resets automatically after expiry — it&apos;s a soft guide, not a hard cutoff</span>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={starting}
          className="btn btn-primary inline-flex items-center gap-2 text-base px-8 py-3"
        >
          <Play size={18} />
          {starting ? 'Starting…' : 'Start Challenge'}
        </button>
      </div>
    </div>
  );
}
