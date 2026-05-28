import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const promiseAllImplementation: SeedQuestion = {
  slug: 'promise-all-implementation',
  title: 'Promise.all Implementation',
  prompt: `Implement your own version of Promise.all that takes an array of promises and resolves when all promises resolve, or rejects if any promise rejects. Do not use the native \`Promise.all\` function.

> [!info] interview inspiration
> Highly frequent \`Promise\` questions, you may be asked to do \`Promise.allSettled\`, \`Promise.any\`, \`Promise.race\`, it's all related, mostly testing your knowledge of closure and Promise,
`,
  description: `Implement your own version of Promise.all that takes an array of promises and resolves when all promises resolve, or rejects if any promise rejects. Do not use the native \`Promise.all\` function.

> [!info] interview inspiration
> Highly frequent \`Promise\` questions, you may be asked to do \`Promise.allSettled\`, \`Promise.any\`, \`Promise.race\`, it's all related, mostly testing your knowledge of closure and Promise,
`,
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  timeLimitMinutes: 30,
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
  solutions: [
    {
      language: 'javascript',
      explanation: `## The four moving parts

1. **Outer \`new Promise((resolve, reject))\`** — single settlement point. The first \`reject\` wins; later rejections are no-ops because a Promise can only settle once.
2. **Pre-allocated \`result\` array of \`iterable.length\`** — guarantees output order matches input order regardless of which promise resolves first. Writing into a fresh \`[]\` with \`push\` would order by resolution time, which is wrong.
3. **\`completed\` counter** — we can't use \`result.length\` to detect "done" because the array is pre-sized. Count explicit completions instead.
4. **\`Promise.resolve(promise)\`** — wraps non-thenable values (\`1\`, \`'two'\`, \`true\`) so the same \`.then\` chain handles them uniformly. Without it, \`promise.then\` would throw on a plain number.

## Empty-array case

\`Promise.all([])\` must resolve synchronously with \`[]\`. The early \`if (iterable.length === 0) resolve([])\` handles it — otherwise the \`forEach\` body never runs, \`completed\` never increments, and the outer Promise hangs forever.

## Why fail-fast works for free

The first rejected promise calls \`reject(err)\` on the outer Promise. Subsequent resolutions still execute their \`.then\` callbacks and bump \`completed\`, but \`resolve(result)\` after settlement is a silent no-op — the consumer already saw the rejection. No cancellation needed; the contract just says "settle once."`,
      code: `function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    if (promises.length === 0) resolve([]);
    let completed = 0;
    const result = new Array(promises.length).fill(null);
    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then((value) => {
          result[index] = value;
          completed += 1;
          if (completed === promises.length) {
            resolve(result);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  });
}`,
    },
  ],
};
