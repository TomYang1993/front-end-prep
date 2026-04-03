import { Suspense } from 'react';
import { QuestionsSidebar } from '@/components/questions-sidebar';
import { QuestionsFilters } from '@/components/questions-filters';
import { QuestionsStatsBar } from '@/components/questions-stats-bar';
import { QuestionsTable, type QuestionRow } from '@/components/questions-table';
import { getCurrentServerUser } from '@/lib/auth/current-user-server';
import { listPublishedQuestions } from '@/lib/questions';
import { prisma } from '@/lib/db/prisma';
import { createTimer } from '@/lib/server-timing';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { [key: string]: string | undefined };
}

export default async function QuestionsPage({ searchParams }: PageProps) {
  const t = createTimer('GET /questions');
  const user = await t.time('auth', getCurrentServerUser());

  const [allQuestions, submissionStatsByQuestion] = await Promise.all([
    t.time('questions', listPublishedQuestions(user?.id)),
    t.time('submissions', getSubmissionStats(user?.id)),
  ]);
  t.summary();

  // Build question rows with computed fields
  const questionRows: QuestionRow[] = allQuestions.map((q) => ({
    id: q.id,
    slug: q.slug,
    title: q.title,
    description: q.description,
    difficulty: q.difficulty,
    type: q.type,
    accessTier: q.accessTier,
    tags: q.tags,
    locked: q.locked,
    status: submissionStatsByQuestion[q.id] || 'unattempted',
  }));

  // Apply filters from search params
  let filtered = questionRows;

  if (searchParams.type) {
    filtered = filtered.filter((q) => q.type === searchParams.type);
  }
  if (searchParams.difficulty) {
    filtered = filtered.filter((q) => q.difficulty === searchParams.difficulty);
  }
  if (searchParams.status) {
    filtered = filtered.filter((q) => q.status === searchParams.status);
  }
  if (searchParams.query) {
    const qLabel = searchParams.query.toLowerCase();
    filtered = filtered.filter((q) => q.title.toLowerCase().includes(qLabel) || q.description?.toLowerCase().includes(qLabel) || q.tags.some(t => t.toLowerCase().includes(qLabel)));
  }

  const solvedCount = questionRows.filter((q) => q.status === 'solved').length;
  const attemptedCount = questionRows.filter((q) => q.status === 'attempted').length;

  return (
    <div className="questions-layout">
      <Suspense>
        <QuestionsSidebar />
      </Suspense>

      <div className="questions-main">
        {/* Stats bar */}
        <QuestionsStatsBar
          totalQuestions={questionRows.length}
          solvedCount={solvedCount}
          attemptedCount={attemptedCount}
        />

        {/* Filters */}
        <div className="questions-filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
          <Suspense>
            <QuestionsFilters />
          </Suspense>
        </div>

        {/* Table */}
        <QuestionsTable questions={filtered} />
      </div>
    </div>
  );
}

async function getSubmissionStats(userId?: string) {
  const stats: Record<string, 'solved' | 'attempted'> = {};
  if (!userId) return stats;

  const submissions = await prisma.submission.findMany({
    where: { userId },
    select: { questionId: true, status: true },
  });
  for (const sub of submissions) {
    if (sub.status === 'PASSED') {
      stats[sub.questionId] = 'solved';
    } else if (!stats[sub.questionId]) {
      stats[sub.questionId] = 'attempted';
    }
  }
  return stats;
}

