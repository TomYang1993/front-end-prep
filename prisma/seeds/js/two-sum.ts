import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const twoSum: SeedQuestion = {
  slug: 'two-sum',
  title: 'Two Sum',
  prompt: 'Return indices of the two numbers that add up to target.',
  description: 'Find two indexes with sum equal to target',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.EASY,
  accessTier: AccessTier.FREE,
  tags: ['array'],
  starterCode: {
    javascript: 'function twoSum(nums, target) {\n  return [];\n}',
    typescript: 'function twoSum(nums: number[], target: number): number[] {\n  return [];\n}',
  },
  publicTestCode: `test('basic case — nums [2,7,11,15] with target 9', () => {
  expect(twoSum([2, 7, 11, 15], 9)).toEqual([0, 1]);
});

test('another pair — nums [3,2,4] with target 6', () => {
  expect(twoSum([3, 2, 4], 6)).toEqual([1, 2]);
});`,
  hiddenTestCode: `test('single pair', () => {
  expect(twoSum([1, 2], 3)).toEqual([0, 1]);
});

test('negative numbers', () => {
  expect(twoSum([-1, -2, -3, -4, -5], -8)).toEqual([2, 4]);
});

test('large numbers', () => {
  expect(twoSum([1000000, 500000, 500000], 1000000)).toEqual([1, 2]);
});

test('first and last', () => {
  expect(twoSum([3, 5, 7, 11], 14)).toEqual([0, 3]);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: 'Use a hash map to track complements in O(n).',
      code: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i += 1) {\n    const need = target - nums[i];\n    if (map.has(need)) return [map.get(need), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}',
    },
  ],
};
