import { prisma } from '@/lib/db/prisma';
import { canAccessQuestion, getEntitlementContext } from '@/lib/auth/entitlement';

export async function listPublishedQuestions(userId?: string) {
  const entitlement = userId ? await getEntitlementContext(userId) : null;

  const questions = await prisma.question.findMany({
    where: { isPublished: true },
    include: {
      tags: { include: { tag: true } }
    },
    orderBy: [{ difficulty: 'asc' }, { createdAt: 'desc' }]
  });

  return questions.map((question) => ({
    ...question,
    tags: question.tags.map((item) => item.tag.name),
    locked: !canAccessQuestion(question.accessTier, question.id, entitlement)
  }));
}

export async function getQuestionDetailBySlug(slug: string, userId?: string) {
  const question = await prisma.question.findUnique({
    where: { slug },
    include: {
      tags: { include: { tag: true } },
      versions: {
        where: { status: 'PUBLISHED' },
        orderBy: { version: 'desc' },
        take: 1
      },
      testCases: {
        where: { visibility: 'PUBLIC' },
        orderBy: { sortOrder: 'asc' }
      },
      officialSolutions: {
        orderBy: { updatedAt: 'desc' }
      },
      packLinks: true,
      threads: {
        where: { status: 'ACTIVE' },
        include: {
          comments: true,
          likes: true,
          user: {
            include: {
              profile: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    }
  });

  if (!question || !question.isPublished) {
    return null;
  }

  const entitlement = userId ? await getEntitlementContext(userId) : null;
  const locked = !canAccessQuestion(question.accessTier, question.id, entitlement);

  return {
    ...question,
    tags: question.tags.map((item) => item.tag.name),
    starterCode: question.versions[0]?.starterCode as Record<string, string> | undefined,
    packId: question.packLinks[0]?.packId || null,
    locked
  };
}
