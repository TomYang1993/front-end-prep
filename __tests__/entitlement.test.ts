import { describe, expect, test } from 'vitest';
import { canAccessQuestion } from '@/lib/entitlements/can-access';

describe('canAccessQuestion', () => {
  test('always allows free questions', () => {
    expect(canAccessQuestion('FREE', 'q1', null)).toBe(true);
  });

  test('blocks premium when no entitlement context', () => {
    expect(canAccessQuestion('PREMIUM', 'q1', null)).toBe(false);
  });

  test('allows premium for active subscription', () => {
    expect(
      canAccessQuestion('PREMIUM', 'q1', {
        hasPro: true,
        unlockedPackQuestionIds: []
      })
    ).toBe(true);
  });

  test('allows premium for unlocked pack question', () => {
    expect(
      canAccessQuestion('PREMIUM', 'q1', {
        hasPro: false,
        unlockedPackQuestionIds: ['q1']
      })
    ).toBe(true);
  });
});
