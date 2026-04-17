import { Suspense } from 'react';
import { QuestionsFilters } from '@/components/questions-filters';
import { QuestionsStatsBar } from '@/components/questions-stats-bar';
import { QuestionsTable, type QuestionRow } from '@/components/questions-table';
import { getCurrentServerUser } from '@/lib/auth/current-user-server';
import { listPublishedQuestions } from '@/lib/questions';
import { prisma } from '@/lib/db/prisma';
import { createTimer } from '@/lib/server-timing';
import { getUserStreak } from '@/lib/streak';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function QuestionsPage({ searchParams: searchParamsPromise }: PageProps) {
  const searchParams = await searchParamsPromise;
  const t = createTimer('GET /questions');
  const user = await t.time('auth', getCurrentServerUser());

  const [allQuestions, submissionStatsByQuestion, streak] = await Promise.all([
    t.time('questions', listPublishedQuestions(user?.id)),
    t.time('submissions', getSubmissionStats(user?.id)),
    t.time('streak', user ? getUserStreak(user.id) : Promise.resolve(0)),
  ]);
  t.summary();

  // Build question rows with computed fields
  const questionRows: QuestionRow[] = allQuestions.map((q) => {
    const stat = submissionStatsByQuestion[q.id];
    return {
      id: q.id,
      slug: q.slug,
      title: q.title,
      description: q.description,
      difficulty: q.difficulty,
      type: q.type,
      accessTier: q.accessTier,
      tags: q.tags,
      locked: q.locked,
      status: stat?.status ?? 'unattempted',
      passedCount: stat?.passedCount ?? 0,
    };
  });

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

  // Pagination — client-side slicing of filtered results
  const PAGE_SIZE = 25;
  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const page = Math.max(1, Math.min(parseInt(searchParams.page || '1', 10) || 1, totalPages));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Serialize current search params for pagination links
  const currentParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== 'page') currentParams[key] = value;
  }

  // Categorise questions by tags for the stats bar
  const categorise = (q: QuestionRow) => {
    const t = q.tags.map(s => s.toLowerCase()).join(' ') + ' ' + q.type.toLowerCase();
    if (/react|css|html|ui|dom|component|layout|style/i.test(t)) return 'ui';
    if (/node|api|server|backend|database|express|rest/i.test(t)) return 'backend';
    if (/concept|pattern|design|system|architecture|theory/i.test(t)) return 'concepts';
    return 'js';
  };

  const cats = { js: { solved: 0, total: 0 }, ui: { solved: 0, total: 0 }, backend: { solved: 0, total: 0 }, concepts: { solved: 0, total: 0 } };
  for (const q of questionRows) {
    const cat = categorise(q);
    cats[cat].total++;
    if (q.status === 'solved') cats[cat].solved++;
  }

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
      <div className="grid gap-5 py-8">
        {/* Stats bar */}
        <QuestionsStatsBar
          isLoggedIn={!!user}
          streak={streak}
          totalQuestions={questionRows.length}
          solvedCount={solvedCount}
          js={cats.js}
          ui={cats.ui}
          backend={cats.backend}
          concepts={cats.concepts}
        />

        {/* Filters */}
        <div className="flex items-center gap-4 w-full">
          <Suspense>
            <QuestionsFilters />
          </Suspense>
        </div>

        {/* Table */}
        <QuestionsTable
          questions={paginated}
          isLoggedIn={!!user}
          page={page}
          totalPages={totalPages}
          totalFiltered={totalFiltered}
          searchParams={currentParams}
        />
      </div>
    </div>
  );
}

async function getSubmissionStats(userId?: string) {
  const stats: Record<string, { status: 'solved' | 'attempted'; passedCount: number }> = {};
  if (!userId) return stats;

  const submissions = await prisma.submission.findMany({
    where: { userId },
    select: { questionId: true, status: true },
  });
  for (const sub of submissions) {
    if (!stats[sub.questionId]) {
      stats[sub.questionId] = { status: 'attempted', passedCount: 0 };
    }
    if (sub.status === 'PASSED') {
      stats[sub.questionId].status = 'solved';
      stats[sub.questionId].passedCount += 1;
    }
  }
  return stats;
}

