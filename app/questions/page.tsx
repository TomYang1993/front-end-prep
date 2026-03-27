import { Suspense } from 'react';
import { QuestionsSidebar } from '@/components/questions-sidebar';
import { QuestionsFilters } from '@/components/questions-filters';
import { QuestionsTable, type QuestionRow } from '@/components/questions-table';
import { getCurrentServerUser } from '@/lib/auth/current-user-server';
import { listPublishedQuestions } from '@/lib/questions';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { [key: string]: string | undefined };
}

export default async function QuestionsPage({ searchParams }: PageProps) {
  const user = await getCurrentServerUser();
  const allQuestions = await listPublishedQuestions(user?.id);

  // Get submission stats for the current user
  let submissionStatsByQuestion: Record<string, 'solved' | 'attempted'> = {};
  if (user) {
    const submissions = await prisma.submission.findMany({
      where: { userId: user.id },
      select: { questionId: true, status: true },
    });
    for (const sub of submissions) {
      if (sub.status === 'PASSED') {
        submissionStatsByQuestion[sub.questionId] = 'solved';
      } else if (!submissionStatsByQuestion[sub.questionId]) {
        submissionStatsByQuestion[sub.questionId] = 'attempted';
      }
    }
  }

  // Build question rows with computed fields
  const questionRows: QuestionRow[] = allQuestions.map((q) => ({
    id: q.id,
    slug: q.slug,
    title: q.title,
    difficulty: q.difficulty,
    type: q.type,
    accessTier: q.accessTier,
    tags: q.tags,
    locked: q.locked,
    status: submissionStatsByQuestion[q.id] || 'unattempted',
    // Deterministic pseudo-attempt count
    attemptsCount: 1500 + (hashCode(q.slug) % 5000),
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
  if (searchParams.tier) {
    filtered = filtered.filter((q) => q.accessTier === searchParams.tier);
  }
  if (searchParams.query) {
    const qLabel = searchParams.query.toLowerCase();
    filtered = filtered.filter((q) => q.title.toLowerCase().includes(qLabel) || q.tags.some(t => t.toLowerCase().includes(qLabel)));
  }

  const solvedCount = questionRows.filter((q) => q.status === 'solved').length;

  return (
    <div className="questions-layout">
      <Suspense>
        <QuestionsSidebar totalQuestions={questionRows.length} solvedCount={solvedCount} />
      </Suspense>

      <div className="questions-main">
        {/* Header */}
        <div className="questions-header">
          <div>
            <h1>Front-end Explorer</h1>
            <p className="questions-header-desc">
              Master UI engineering, logic patterns, and high-performance system designs. Built for the modern web architect.
            </p>
          </div>
        </div>

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

/** Simple deterministic hash for pseudo-random acceptance rates */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
