import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { EditorWorkspace } from '@/components/editor-workspace';
import { ReactEditorWorkspace } from '@/components/react-editor-workspace';
import { PremiumUpsell } from '@/components/premium-upsell';
import { QuestionStartScreen } from '@/components/question-start-screen';
import { getCurrentServerUser } from '@/lib/auth/current-user-server';
import { getQuestionDetailBySlug } from '@/lib/questions';
import { getDefaultTimeLimitMinutes } from '@/lib/question-timer';
import { prisma } from '@/lib/db/prisma';
import { createTimer } from '@/lib/server-timing';
import type { Difficulty, QuestionType } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function QuestionDetailPage({ params }: PageProps) {
  const t = createTimer(`GET /questions/${params.slug}`);
  const user = await t.time('auth', getCurrentServerUser());

  if (!user) {
    redirect(`/auth?next=/questions/${encodeURIComponent(params.slug)}`);
  }

  const question = await t.time('query', getQuestionDetailBySlug(params.slug, user.id));
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

  // ─── Timer check ───
  const existingTimer = await prisma.questionTimer.findUnique({
    where: { userId_questionId: { userId: user.id, questionId: question.id } },
  });

  let expiresAt: string | null = null;

  if (existingTimer) {
    const expiry = new Date(existingTimer.startedAt.getTime() + existingTimer.timeLimitMinutes * 60_000);
    if (expiry > new Date()) {
      expiresAt = expiry.toISOString();
    } else {
      // Expired — delete so user sees start screen again
      await prisma.questionTimer.delete({ where: { id: existingTimer.id } });
    }
  }

  // No active timer → show start screen
  if (!expiresAt) {
    const timeLimitMinutes = question.timeLimitMinutes
      ?? getDefaultTimeLimitMinutes(question.type as QuestionType, question.difficulty as Difficulty);

    return (
      <QuestionStartScreen
        slug={params.slug}
        title={question.title}
        difficulty={question.difficulty}
        tags={question.tags}
        timeLimitMinutes={timeLimitMinutes}
      />
    );
  }

  // ─── Active timer → show workspace ───
  const publicTests = question.publicTests.map((tc) => ({
    id: tc.id,
    input: tc.input,
    expected: tc.expected,
    explanation: tc.explanation ?? undefined,
  }));

  const starterCode: Record<string, string> = { ...((question.starterCode as Record<string, string>) || {}) };

  const drafts = await prisma.codeDraft.findMany({
    where: { userId: user.id, questionId: question.id }
  });
  for (const d of drafts) {
    if (d.framework === 'react') {
      try {
        const parsed = JSON.parse(d.code);
        if (parsed.app) starterCode.react = parsed.app;
        if (parsed.styles) starterCode.css = parsed.styles;
      } catch {
        // ignore parsing error
      }
    } else {
      starterCode[d.framework] = d.code;
    }
  }

  if (question.type === 'FUNCTION_JS' || question.type === 'FUNCTION_PYTHON') {
    return (
      <EditorWorkspace
        questionId={question.id}
        questionType={question.type}
        title={question.title}
        prompt={question.prompt}
        difficulty={question.difficulty}
        tags={question.tags}
        starterCode={starterCode}
        publicTests={publicTests}
        expiresAt={expiresAt}
      />
    );
  }

  return (
    <ReactEditorWorkspace
      questionId={question.id}
      title={question.title}
      prompt={question.prompt}
      difficulty={question.difficulty}
      tags={question.tags}
      starterCode={question.starterCode || undefined}
      publicTests={publicTests}
      expiresAt={expiresAt}
    />
  );
}
