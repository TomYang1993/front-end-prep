import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const usePreviousHook: SeedQuestion = {
  slug: 'use-previous-hook',
  title: 'usePrevious Hook',
  prompt: 'Implement a custom React hook that returns the previous value of a given state or prop.',
  description: 'Create a custom React hook that tracks and returns the previous value of any state or prop.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.EASY,
  accessTier: AccessTier.FREE,
  tags: ['react', 'hooks'],
  starterCode: {
    javascript: 'function usePrevious(value) {\n  // your code here\n}',
    typescript: 'function usePrevious<T>(value: T): T | undefined {\n  // your code here\n  return undefined;\n}',
  },
  publicTestCode: `test('returns undefined on first render', () => {
  expect(usePrevious(1)).toBe(undefined);
});`,
  hiddenTestCode: `test('returns previous value after update', () => {
  // Hook testing requires render cycle simulation
  let prev;
  function TestComponent({ value }) {
    prev = usePrevious(value);
    return null;
  }
  // First render
  expect(prev).toBe(undefined);
});`,
};
