import { prisma } from '@/lib/db/prisma';

/**
 * Compute current submission streak for a user.
 *
 * Rules:
 * - Any submission (pass or fail) counts as an active day.
 * - Multiple submissions on the same UTC day = 1 active day.
 * - If latest active day is today or yesterday, streak is alive.
 * - One missed day resets to 0.
 */
export async function getUserStreak(userId: string): Promise<number> {
  const submissions = await prisma.submission.findMany({
    where: { userId },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  if (submissions.length === 0) return 0;

  // Unique UTC dates, most recent first
  const seen = new Set<string>();
  const dates: string[] = [];
  for (const s of submissions) {
    const day = s.createdAt.toISOString().slice(0, 10);
    if (!seen.has(day)) {
      seen.add(day);
      dates.push(day);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  // Streak must start from today or yesterday
  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + 'T00:00:00Z');
    prev.setUTCDate(prev.getUTCDate() - 1);
    if (dates[i] === prev.toISOString().slice(0, 10)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
