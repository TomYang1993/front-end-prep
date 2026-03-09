import Link from 'next/link';
import clsx from 'clsx';

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
    <article className="question-card">
      <div className="question-card-top">
        <div>
          <h3>{props.title}</h3>
          <p className="meta-row">
            <span>{props.type}</span>
            <span className={clsx('difficulty', props.difficulty.toLowerCase())}>{props.difficulty}</span>
            <span>{props.accessTier}</span>
          </p>
        </div>
        {props.locked ? <span className="pill lock">Locked</span> : <span className="pill">Open</span>}
      </div>
      <p className="tag-row">
        {props.tags.map((tag) => (
          <span key={tag} className="tag">
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
