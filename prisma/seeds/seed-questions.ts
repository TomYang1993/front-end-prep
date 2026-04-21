import { PrismaClient, QuestionType, Difficulty, QuestionVersionStatus } from '@prisma/client';
import type { SeedQuestion } from './types';
import { refreshQuestionRenderData } from '../../lib/questions-snapshot';

function defaultTimeLimit(type: QuestionType, difficulty: Difficulty): number {
  if (type === 'REACT_APP') return 60;
  if (difficulty === 'EASY') return 30;
  if (difficulty === 'HARD') return 60;
  return 45;
}

/**
 * Ensure tag names exist and return a name → id map.
 */
async function ensureTags(prisma: PrismaClient, tagNames: string[]) {
  const tagMap = new Map<string, string>();
  for (const name of tagNames) {
    const tag = await prisma.questionTag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    tagMap.set(name, tag.id);
  }
  return tagMap;
}

/**
 * Seed a single question with all related data:
 * tags, version (starter code), test code, and solutions.
 *
 * Fully self-contained — resolves its own tags.
 * Safe to call repeatedly (all operations are upserts).
 */
export async function seedQuestion(
  prisma: PrismaClient,
  question: SeedQuestion,
  createdById: string,
) {
  const tagMap = await ensureTags(prisma, question.tags);

  const q = await prisma.question.upsert({
    where: { slug: question.slug },
    update: {
      title: question.title,
      prompt: question.prompt,
      type: question.type,
      difficulty: question.difficulty,
      accessTier: question.accessTier,
      timeLimitMinutes: question.timeLimitMinutes ?? defaultTimeLimit(question.type, question.difficulty),
      publicTestCode: question.publicTestCode,
      hiddenTestCode: question.hiddenTestCode ?? null,
    },
    create: {
      slug: question.slug,
      title: question.title,
      prompt: question.prompt,
      type: question.type,
      difficulty: question.difficulty,
      accessTier: question.accessTier,
      timeLimitMinutes: question.timeLimitMinutes ?? defaultTimeLimit(question.type, question.difficulty),
      isPublished: true,
      createdById,
      publicTestCode: question.publicTestCode,
      hiddenTestCode: question.hiddenTestCode ?? null,
    },
  });

  // Link tags
  for (const tagName of question.tags) {
    const tagId = tagMap.get(tagName)!;
    await prisma.questionTagOnQuestion.upsert({
      where: { questionId_tagId: { questionId: q.id, tagId } },
      update: {},
      create: { questionId: q.id, tagId },
    });
  }

  // Version with starter code
  await prisma.questionVersion.upsert({
    where: { questionId_version: { questionId: q.id, version: 1 } },
    update: { starterCode: question.starterCode },
    create: {
      questionId: q.id,
      version: 1,
      status: QuestionVersionStatus.PUBLISHED,
      content: { description: question.description },
      starterCode: question.starterCode,
      publishedAt: new Date(),
    },
  });

  // Refresh denormalized renderData so the read path (lib/questions.ts)
  // sees the latest starterCode, tags, description, and publicTestCode.
  // Without this, edits to QuestionVersion are invisible to the editor.
  await refreshQuestionRenderData(q.id);

  // Official solutions
  if (question.solutions) {
    for (const sol of question.solutions) {
      const solId = `${q.id}-official-${sol.language}`;
      await prisma.officialSolution.upsert({
        where: { id: solId },
        update: {
          explanation: sol.explanation,
          code: sol.code,
          complexity: sol.complexity ?? null,
        },
        create: {
          id: solId,
          questionId: q.id,
          language: sol.language,
          explanation: sol.explanation,
          code: sol.code,
          complexity: sol.complexity ?? null,
        },
      });
    }
  }

  return q;
}

/**
 * Seed all questions. Returns a slug → Question record map
 * so the caller can reference questions for packs, submissions, etc.
 */
export async function seedAllQuestions(
  prisma: PrismaClient,
  questions: SeedQuestion[],
  createdById: string,
) {
  const questionMap = new Map<string, { id: string }>();

  for (const q of questions) {
    const record = await seedQuestion(prisma, q, createdById);
    questionMap.set(q.slug, record);
  }

  return questionMap;
}
