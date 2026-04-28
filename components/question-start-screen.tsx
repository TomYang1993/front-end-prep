'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Play, Timer, RefreshCw } from 'lucide-react';
import { DIFFICULTY_LABEL, DIFFICULTY_BADGE_CLASS } from '@/types/domain';

interface QuestionStartScreenProps {
  slug: string;
  title: string;
  difficulty: string;
  tags: string[];
  timeLimitMinutes: number;
  questionType: string;
}

export function QuestionStartScreen({
  slug,
  title,
  difficulty,
  tags,
  timeLimitMinutes,
  questionType,
}: QuestionStartScreenProps) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [reactLanguage, setReactLanguage] = useState<'js' | 'ts'>('js');
  const isReact = questionType === 'REACT_APP';

  async function handleStart() {
    setStarting(true);
    try {
      const res = await fetch(`/api/questions/${slug}/timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isReact ? { reactLanguage } : {}),
      });
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
              className={`inline-flex items-center px-2 py-1 rounded-sm text-[0.65rem] font-bold uppercase tracking-[0.05em] leading-none ${DIFFICULTY_BADGE_CLASS[difficulty] ?? ''}`}
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

        {isReact && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-muted">Language</span>
            <div className="flex items-center bg-surface-raised rounded-lg overflow-hidden border border-line text-sm font-bold">
              <button
                onClick={() => setReactLanguage('js')}
                className={`px-5 py-2 border-none cursor-pointer transition-colors ${reactLanguage === 'js' ? 'bg-brand text-white' : 'bg-transparent text-muted hover:text-ink'}`}
              >JavaScript</button>
              <button
                onClick={() => setReactLanguage('ts')}
                className={`px-5 py-2 border-none cursor-pointer transition-colors ${reactLanguage === 'ts' ? 'bg-brand text-white' : 'bg-transparent text-muted hover:text-ink'}`}
              >TypeScript</button>
            </div>
          </div>
        )}

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
