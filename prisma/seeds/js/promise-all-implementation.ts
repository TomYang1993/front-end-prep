import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const promiseAllImplementation: SeedQuestion = {
  slug: 'promise-all-implementation',
  title: 'Promise.all Implementation',
  prompt: 'Implement your own version of Promise.all that takes an array of promises and resolves when all promises resolve, or rejects if any promise rejects.',
  description: 'Implement Promise.all from scratch — resolve when all promises settle, reject on the first failure.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['utility'],
  starterCode: {
    javascript: 'function promiseAll(promises) {\n  // your code here\n}',
    typescript: 'function promiseAll<T>(promises: Iterable<T | PromiseLike<T>>): Promise<T[]> {\n  // your code here\n  return Promise.resolve([]);\n}',
  },
  publicTestCode: `test('resolves with all values', async () => {
  const result = await promiseAll([
    Promise.resolve(1),
    Promise.resolve(2),
    Promise.resolve(3),
  ]);
  expect(result).toEqual([1, 2, 3]);
});

test('rejects on first failure', async () => {
  try {
    await promiseAll([
      Promise.resolve(1),
      Promise.reject(new Error('fail')),
      Promise.resolve(3),
    ]);
    expect(true).toBe(false); // should not reach
  } catch (e) {
    expect(e.message).toBe('fail');
  }
});`,
  hiddenTestCode: `test('handles empty array', async () => {
  const result = await promiseAll([]);
  expect(result).toEqual([]);
});

test('preserves order', async () => {
  const result = await promiseAll([
    new Promise(r => setTimeout(() => r('slow'), 50)),
    Promise.resolve('fast'),
  ]);
  expect(result).toEqual(['slow', 'fast']);
});

test('handles non-promise values', async () => {
  const result = await promiseAll([1, 'two', true]);
  expect(result).toEqual([1, 'two', true]);
});`,
};
