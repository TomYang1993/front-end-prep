import { describe, expect, it } from 'vitest';
import { canAccessQuestion } from '@/lib/entitlements/can-access';

const ctxNoPro = { hasPro: false, unlockedPackQuestionIds: [] };
const ctxPro = { hasPro: true, unlockedPackQuestionIds: [] };
const ctxPack = { hasPro: false, unlockedPackQuestionIds: ['q1', 'q2'] };

describe('canAccessQuestion', () => {
  it('FREE always accessible regardless of context', () => {
    expect(canAccessQuestion('FREE', 'q1', null)).toBe(true);
    expect(canAccessQuestion('FREE', 'q1', ctxNoPro)).toBe(true);
    expect(canAccessQuestion('FREE', 'q1', ctxPro)).toBe(true);
  });

  it('PRO denied when context null (logged out)', () => {
    expect(canAccessQuestion('PRO', 'q1', null)).toBe(false);
  });

  it('PRO denied when no pro and not in unlocked packs', () => {
    expect(canAccessQuestion('PRO', 'q99', ctxNoPro)).toBe(false);
    expect(canAccessQuestion('PRO', 'q99', ctxPack)).toBe(false);
  });

  it('PRO allowed when hasPro', () => {
    expect(canAccessQuestion('PRO', 'q99', ctxPro)).toBe(true);
  });

  it('PRO allowed when unlocked via pack', () => {
    expect(canAccessQuestion('PRO', 'q1', ctxPack)).toBe(true);
    expect(canAccessQuestion('PRO', 'q2', ctxPack)).toBe(true);
  });
});
