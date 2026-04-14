import Link from 'next/link';
import clsx from 'clsx';
import { DIFFICULTY_LABEL } from '@/types/domain';

interface QuestionCardProps {
  slug: string;
  title: string;
  difficulty: string;
  type: string;
  accessTier: string;
  tags: string[];
  locked: boolean;
}

export function QuestionCard(props: QuestionCardProps) {
  return (
    <article className="bg-surface border border-line rounded-2xl p-4 shadow-lg transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="m-0">{props.title}</h3>
          <p className="meta-row">
            <span>{props.type}</span>
            <span className={clsx('font-semibold', props.difficulty.toLowerCase() === 'easy' ? 'text-good' : props.difficulty.toLowerCase() === 'medium' ? 'text-caution' : 'text-warn')}>{DIFFICULTY_LABEL[props.difficulty] ?? props.difficulty}</span>
            <span>{props.accessTier}</span>
          </p>
        </div>
        {props.locked
          ? <span className="text-[0.74rem] uppercase tracking-[0.08em] px-2 py-0.5 rounded-full bg-warn-subtle text-warn">Locked</span>
          : <span className="text-[0.74rem] uppercase tracking-[0.08em] px-2 py-0.5 rounded-full bg-brand-subtle text-good">Open</span>}
      </div>
      <p className="flex gap-2 flex-wrap text-muted text-[0.88rem]">
        {props.tags.map((tag) => (
          <span key={tag} className="bg-bg-subtle rounded-full px-2 py-0.5 transition-colors duration-200">
            {tag}
          </span>
        ))}
      </p>
      <Link href={`/questions/${props.slug}`} className="card-link">
        Open problem
      </Link>
    </article>
  );
}
