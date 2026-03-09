import { AccessTier } from '@prisma/client';

export function canAccessQuestion(
  accessTier: AccessTier,
  questionId: string,
  context: { hasPro: boolean; unlockedPackQuestionIds: string[] } | null
): boolean {
  if (accessTier === 'FREE') return true;
  if (!context) return false;
  if (context.hasPro) return true;
  return context.unlockedPackQuestionIds.includes(questionId);
}
