import { Suspense } from 'react';
import { QuestionsSidebar } from '@/components/questions-sidebar';
import { QuestionsFilters } from '@/components/questions-filters';
import { QuestionsTable, type QuestionRow } from '@/components/questions-table';
import { getCurrentServerUser } from '@/lib/auth/current-user-server';
import { listPublishedQuestions } from '@/lib/questions';
import { prisma } from '@/lib/db/prisma';
import { TrendingUp, Trophy, Lightbulb } from 'lucide-react';

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
    // Deterministic pseudo-acceptance based on difficulty
    acceptance: q.difficulty === 'EASY' ? 78 + hashCode(q.slug) % 15
              : q.difficulty === 'MEDIUM' ? 35 + hashCode(q.slug) % 20
              : 10 + hashCode(q.slug) % 15,
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

        {/* Filters + Stat */}
        <div className="questions-filter-bar">
          <Suspense>
            <QuestionsFilters />
          </Suspense>
          <div className="questions-stat-box">
            <span className="stat-box-label">Questions</span>
            <div>
              <span className="stat-box-value">{solvedCount}</span>
              <span className="stat-box-total"> / {questionRows.length}</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <QuestionsTable questions={filtered} />

        {/* Stat Widgets */}
        <div className="stat-widgets">
          <div className="stat-widget">
            <div className="stat-widget-header">
              <span className="stat-widget-icon streak flex items-center justify-center"><TrendingUp size={20} /></span>
              <span className="stat-widget-title">Daily Streak</span>
            </div>
            <div className="stat-widget-body">
              <div className="stat-widget-number">1</div>
              <div className="stat-widget-caption">Day of continuous practice.</div>
            </div>
          </div>

          <div className="stat-widget">
            <div className="stat-widget-header">
              <span className="stat-widget-icon rank flex items-center justify-center"><Trophy size={20} /></span>
              <span className="stat-widget-title">Progress</span>
            </div>
            <div className="stat-widget-body">
              <div className="stat-widget-number">{solvedCount}</div>
              <div className="stat-widget-caption">Problems solved out of {questionRows.length} available.</div>
            </div>
          </div>

          <div className="stat-widget">
            <div className="stat-widget-header">
              <span className="stat-widget-icon skills flex items-center justify-center"><Lightbulb size={20} /></span>
              <span className="stat-widget-title">Skills Focus</span>
            </div>
            <div className="stat-skill-chips">
              <span className="skill-chip js">Core JS</span>
              <span className="skill-chip react">React Patterns</span>
              <span className="skill-chip perf">Web Perf</span>
            </div>
          </div>
        </div>
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
