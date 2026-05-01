import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const findMany = vi.fn();
vi.mock('@/lib/db/prisma', () => ({
  prisma: { submission: { findMany: (...args: unknown[]) => findMany(...args) } }
}));

const day = (iso: string) => ({ createdAt: new Date(iso) });

describe('getUserStreak', () => {
  beforeEach(() => {
    findMany.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-30T15:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 when no submissions', async () => {
    findMany.mockResolvedValue([]);
    const { getUserStreak } = await import('@/lib/streak');
    expect(await getUserStreak('u1')).toBe(0);
  });

  it('returns 0 when latest is older than yesterday', async () => {
    findMany.mockResolvedValue([day('2026-04-25T10:00:00Z')]);
    const { getUserStreak } = await import('@/lib/streak');
    expect(await getUserStreak('u1')).toBe(0);
  });

  it('returns 1 when latest is today only', async () => {
    findMany.mockResolvedValue([day('2026-04-30T01:00:00Z')]);
    const { getUserStreak } = await import('@/lib/streak');
    expect(await getUserStreak('u1')).toBe(1);
  });

  it('returns 1 when latest is yesterday only', async () => {
    findMany.mockResolvedValue([day('2026-04-29T22:00:00Z')]);
    const { getUserStreak } = await import('@/lib/streak');
    expect(await getUserStreak('u1')).toBe(1);
  });

  it('counts consecutive days ending today', async () => {
    findMany.mockResolvedValue([
      day('2026-04-30T05:00:00Z'),
      day('2026-04-29T05:00:00Z'),
      day('2026-04-28T05:00:00Z'),
      day('2026-04-27T05:00:00Z')
    ]);
    const { getUserStreak } = await import('@/lib/streak');
    expect(await getUserStreak('u1')).toBe(4);
  });

  it('dedups multiple submissions in same UTC day', async () => {
    findMany.mockResolvedValue([
      day('2026-04-30T23:00:00Z'),
      day('2026-04-30T05:00:00Z'),
      day('2026-04-29T12:00:00Z'),
      day('2026-04-29T01:00:00Z')
    ]);
    const { getUserStreak } = await import('@/lib/streak');
    expect(await getUserStreak('u1')).toBe(2);
  });

  it('breaks streak on a missed day', async () => {
    findMany.mockResolvedValue([
      day('2026-04-30T05:00:00Z'),
      day('2026-04-29T05:00:00Z'),
      day('2026-04-27T05:00:00Z'),
      day('2026-04-26T05:00:00Z')
    ]);
    const { getUserStreak } = await import('@/lib/streak');
    expect(await getUserStreak('u1')).toBe(2);
  });

  it('handles UTC midnight edge — submission at 23:59 vs 00:01 next day', async () => {
    vi.setSystemTime(new Date('2026-04-30T00:05:00Z'));
    findMany.mockResolvedValue([
      day('2026-04-30T00:01:00Z'),
      day('2026-04-29T23:59:00Z'),
      day('2026-04-28T12:00:00Z')
    ]);
    const { getUserStreak } = await import('@/lib/streak');
    expect(await getUserStreak('u1')).toBe(3);
  });
});
