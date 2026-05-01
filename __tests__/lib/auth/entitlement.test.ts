import { beforeEach, describe, expect, it, vi } from 'vitest';

const findMany = vi.fn();
vi.mock('@/lib/db/prisma', () => ({
  prisma: { entitlement: { findMany: (...args: unknown[]) => findMany(...args) } }
}));

describe('getEntitlementContext', () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it('hasPro=false + empty packs when user has no entitlements', async () => {
    findMany.mockResolvedValue([]);
    const { getEntitlementContext } = await import('@/lib/auth/entitlement');
    const ctx = await getEntitlementContext('u1');
    expect(ctx).toEqual({ hasPro: false, unlockedPackQuestionIds: [] });
  });

  it('SUBSCRIPTION entitlement sets hasPro=true', async () => {
    findMany.mockResolvedValue([
      { source: 'SUBSCRIPTION', pack: null }
    ]);
    const { getEntitlementContext } = await import('@/lib/auth/entitlement');
    expect((await getEntitlementContext('u1')).hasPro).toBe(true);
  });

  it('PACK entitlement aggregates question ids from pack links', async () => {
    findMany.mockResolvedValue([
      {
        source: 'PACK',
        pack: { links: [{ questionId: 'q1' }, { questionId: 'q2' }] }
      },
      {
        source: 'PACK',
        pack: { links: [{ questionId: 'q3' }] }
      }
    ]);
    const { getEntitlementContext } = await import('@/lib/auth/entitlement');
    const ctx = await getEntitlementContext('u1');
    expect(ctx.hasPro).toBe(false);
    expect(ctx.unlockedPackQuestionIds.sort()).toEqual(['q1', 'q2', 'q3']);
  });

  it('mixed SUBSCRIPTION + PACK exposes both signals', async () => {
    findMany.mockResolvedValue([
      { source: 'SUBSCRIPTION', pack: null },
      { source: 'PACK', pack: { links: [{ questionId: 'q1' }] } }
    ]);
    const { getEntitlementContext } = await import('@/lib/auth/entitlement');
    const ctx = await getEntitlementContext('u1');
    expect(ctx).toEqual({ hasPro: true, unlockedPackQuestionIds: ['q1'] });
  });

  it('queries only active, non-expired entitlements for the user', async () => {
    findMany.mockResolvedValue([]);
    const { getEntitlementContext } = await import('@/lib/auth/entitlement');
    await getEntitlementContext('user-42');
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-42',
          active: true,
          OR: [{ endsAt: null }, { endsAt: { gt: expect.any(Date) } }]
        })
      })
    );
  });
});
