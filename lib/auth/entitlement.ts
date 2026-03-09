import { prisma } from '@/lib/db/prisma';
export { canAccessQuestion } from '@/lib/entitlements/can-access';

export async function getEntitlementContext(userId: string) {
  const now = new Date();
  const entitlements = await prisma.entitlement.findMany({
    where: {
      userId,
      active: true,
      OR: [{ endsAt: null }, { endsAt: { gt: now } }]
    },
    include: {
      pack: {
        include: {
          links: true
        }
      }
    }
  });

  const hasPro = entitlements.some((entitlement) => entitlement.source === 'SUBSCRIPTION');
  const unlockedPackQuestionIds = entitlements
    .flatMap((entitlement) => entitlement.pack?.links || [])
    .map((link) => link.questionId);

  return { hasPro, unlockedPackQuestionIds };
}
