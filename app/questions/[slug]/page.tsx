import Link from 'next/link';
import { notFound } from 'next/navigation';
import { QuestionTabs } from '@/components/question-tabs';
import { PremiumUpsell } from '@/components/premium-upsell';
import { getCurrentServerUser } from '@/lib/auth/current-user-server';
import { getQuestionDetailBySlug } from '@/lib/questions';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function QuestionDetailPage({ params }: PageProps) {
  const user = await getCurrentServerUser();
  const question = await getQuestionDetailBySlug(params.slug, user?.id);

  if (!question) {
    notFound();
  }

  if (question.locked) {
    return (
      <section className="premium-lock">
        <h1>{question.title}</h1>
        <p>This is a premium question.</p>
        <p>Unlock by subscribing to Pro or buying a content pack.</p>
        <PremiumUpsell packId={question.packId} />
        <Link href="/questions" className="btn btn-secondary">
          Back to question list
        </Link>
      </section>
    );
  }

  const initialThreads = question.threads.map((thread) => ({
    id: thread.id,
    title: thread.title,
    body: thread.body,
    author: thread.user.profile?.displayName || thread.user.email,
    commentsCount: thread.comments.length,
    likesCount: thread.likes.length,
  }));

  const publicTests = question.testCases.map((testCase) => ({
    id: testCase.id,
    input: testCase.input,
    expected: testCase.expected,
    explanation: testCase.explanation,
  }));

  const solutions = question.officialSolutions.map((solution) => ({
    id: solution.id,
    language: solution.language,
    framework: solution.framework,
    explanation: solution.explanation,
    code: solution.code,
    complexity: solution.complexity,
  }));

  return (
    <section className="stack-gap">
      <article className="question-header">
        <h1>{question.title}</h1>
        <p>{question.prompt}</p>
        <p className="meta-row">
          <span>{question.type}</span>
          <span className={`difficulty ${question.difficulty.toLowerCase()}`}>{question.difficulty}</span>
          <span>{question.accessTier}</span>
        </p>
        <p className="tag-row">
          {question.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </p>
      </article>

      <QuestionTabs
        questionId={question.id}
        type={question.type}
        starterCode={question.starterCode}
        publicTests={publicTests}
        solutions={solutions}
        initialThreads={initialThreads}
      />
    </section>
  );
}
