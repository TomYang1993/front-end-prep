import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EditorWorkspace } from '@/components/editor-workspace';
import { ReactEditorWorkspace } from '@/components/react-editor-workspace';
import { PremiumUpsell } from '@/components/premium-upsell';
import { getCurrentServerUser } from '@/lib/auth/current-user-server';
import { getQuestionDetailBySlug } from '@/lib/questions';
import { createTimer } from '@/lib/server-timing';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function QuestionDetailPage({ params }: PageProps) {
  const t = createTimer(`GET /questions/${params.slug}`);
  const user = await t.time('auth', getCurrentServerUser());
  const question = await t.time('query', getQuestionDetailBySlug(params.slug, user?.id));
  t.summary();

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

  const publicTests = question.publicTests.map((t) => ({
    id: t.id,
    input: t.input,
    expected: t.expected,
    explanation: t.explanation ?? undefined,
  }));

  if (question.type === 'FUNCTION_JS') {
    return (
      <EditorWorkspace
        questionId={question.id}
        title={question.title}
        prompt={question.prompt}
        difficulty={question.difficulty}
        tags={question.tags}
        starterCode={question.starterCode || undefined}
        publicTests={publicTests}
      />
    );
  }

  // REACT_APP and other types
  return (
    <ReactEditorWorkspace
      questionId={question.id}
      title={question.title}
      prompt={question.prompt}
      difficulty={question.difficulty}
      tags={question.tags}
      starterCode={question.starterCode || undefined}
      publicTests={publicTests}
    />
  );
}
