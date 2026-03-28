import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

/**
 * The shape stored in Question.renderData.
 * Contains everything needed to render the question list row
 * and the full detail page — zero joins at read time.
 */
export interface QuestionRenderData {
  tags: string[];
  starterCode: Record<string, string>;
  publicTests: {
    id: string;
    input: unknown;
    expected: unknown;
    explanation: string | null;
    sortOrder: number;
  }[];
  packId: string | null;
}

/**
 * Compute the denormalized render payload for a single question.
 * Called on admin create/update — never on the read path.
 */
export async function buildQuestionRenderData(questionId: string): Promise<QuestionRenderData> {
  const [tagLinks, latestVersion, publicTests, packLink] = await Promise.all([
    prisma.questionTagOnQuestion.findMany({
      where: { questionId },
      include: { tag: true },
    }),
    prisma.questionVersion.findFirst({
      where: { questionId, status: 'PUBLISHED' },
      orderBy: { version: 'desc' },
    }),
    prisma.testCase.findMany({
      where: { questionId, visibility: 'PUBLIC' },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.contentPackQuestion.findFirst({
      where: { questionId },
    }),
  ]);

  return {
    tags: tagLinks.map((l) => l.tag.name),
    starterCode: (latestVersion?.starterCode ?? {}) as Record<string, string>,
    publicTests: publicTests.map((t) => ({
      id: t.id,
      input: t.input,
      expected: t.expected,
      explanation: t.explanation,
      sortOrder: t.sortOrder,
    })),
    packId: packLink?.packId ?? null,
  };
}

/**
 * Recompute and persist renderData for a question.
 * Call this after any admin mutation that changes question content.
 */
export async function refreshQuestionRenderData(questionId: string) {
  const data = await buildQuestionRenderData(questionId);
  await prisma.question.update({
    where: { id: questionId },
    data: { renderData: data as unknown as Prisma.InputJsonValue },
  });
  return data;
}
