import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const debounceFunction: SeedQuestion = {
  slug: 'debounce-function',
  title: 'Debounce Function',
  prompt: 'Implement a debounce utility function that delays invoking the provided function until after the specified wait time has elapsed since the last invocation.',
  description: 'Implement a debounce utility that delays function calls until a wait period has elapsed since the last invocation.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['utility'],
  starterCode: {
    javascript: 'function debounce(fn, delay) {\n  // your code here\n}',
    typescript: 'function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {\n  // your code here\n}',
  },
  publicTestCode: `test('delays function call', (done) => {
  let called = 0;
  const fn = debounce(() => { called++; }, 50);
  fn();
  expect(called).toBe(0);
  setTimeout(() => {
    expect(called).toBe(1);
    done();
  }, 80);
});

test('resets timer on subsequent calls', (done) => {
  let called = 0;
  const fn = debounce(() => { called++; }, 50);
  fn();
  setTimeout(() => fn(), 30);
  setTimeout(() => {
    expect(called).toBe(1);
    done();
  }, 110);
});`,
  hiddenTestCode: `test('passes arguments to original function', (done) => {
  let received;
  const fn = debounce((a, b) => { received = [a, b]; }, 50);
  fn(1, 2);
  setTimeout(() => {
    expect(received).toEqual([1, 2]);
    done();
  }, 80);
});

test('multiple rapid calls only trigger once', (done) => {
  let count = 0;
  const fn = debounce(() => { count++; }, 50);
  fn(); fn(); fn(); fn(); fn();
  setTimeout(() => {
    expect(count).toBe(1);
    done();
  }, 80);
});`,
};
