import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const promiseChain: SeedQuestion = {
  slug: 'promise-chain',
  title: 'Promise Chain Scheduler',
  prompt: `Implement \`chainAsync(tasks)\` that executes an array of async functions **in sequence** (not in parallel), piping each result into the next.

Each task is a function that takes the previous result and returns a Promise:

\`\`\`js
const tasks = [
  () => Promise.resolve(1),           // start with 1
  (prev) => Promise.resolve(prev + 2), // 1 + 2 = 3
  (prev) => Promise.resolve(prev * 3), // 3 * 3 = 9
];

chainAsync(tasks); // Promise<9>
\`\`\`

### Requirements

1. Execute tasks **left to right**, one at a time — do not start the next until the previous resolves.
2. The **first** task receives \`undefined\` as its argument (no previous result).
3. Return a Promise that resolves with the **final** task's result.
4. If **any** task rejects, the returned promise should reject with that error — do not run subsequent tasks.
5. If the array is empty, resolve with \`undefined\`.`,
  description: 'Execute async functions in sequence, piping each resolved value into the next task.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['promise', 'async'],
  starterCode: {
    javascript: `function chainAsync(tasks) {
  // your code here
}`,
    typescript: `function chainAsync(tasks: Array<(prev?: any) => Promise<any>>): Promise<any> {
  // your code here
}`,
  },
  publicTestCode: `test('chains results through tasks', async () => {
  const tasks = [
    () => Promise.resolve(1),
    (prev) => Promise.resolve(prev + 2),
    (prev) => Promise.resolve(prev * 3),
  ];
  expect(await chainAsync(tasks)).toBe(9);
});

test('rejects if any task fails', async () => {
  const tasks = [
    () => Promise.resolve('ok'),
    () => Promise.reject(new Error('boom')),
    () => Promise.resolve('never'),
  ];
  await expect(chainAsync(tasks)).rejects.toThrow('boom');
});`,
  hiddenTestCode: `test('empty array resolves with undefined', async () => {
  expect(await chainAsync([])).toBeUndefined();
});

test('single task works', async () => {
  expect(await chainAsync([() => Promise.resolve(42)])).toBe(42);
});

test('first task receives undefined', async () => {
  let received;
  await chainAsync([(prev) => { received = prev; return Promise.resolve(1); }]);
  expect(received).toBeUndefined();
});

test('executes in order, not parallel', async () => {
  const order = [];
  const tasks = [
    () => new Promise(r => setTimeout(() => { order.push(1); r('a'); }, 30)),
    () => new Promise(r => setTimeout(() => { order.push(2); r('b'); }, 10)),
    () => new Promise(r => setTimeout(() => { order.push(3); r('c'); }, 20)),
  ];
  await chainAsync(tasks);
  expect(order).toEqual([1, 2, 3]);
});

test('stops on rejection — skips subsequent tasks', async () => {
  let thirdRan = false;
  const tasks = [
    () => Promise.resolve(1),
    () => Promise.reject(new Error('fail')),
    () => { thirdRan = true; return Promise.resolve(3); },
  ];
  await expect(chainAsync(tasks)).rejects.toThrow('fail');
  expect(thirdRan).toBe(false);
});

test('handles mixed sync-like and async tasks', async () => {
  const tasks = [
    () => Promise.resolve(10),
    (prev) => Promise.resolve(prev + 5),
    (prev) => new Promise(r => setTimeout(() => r(prev * 2), 10)),
  ];
  expect(await chainAsync(tasks)).toBe(30);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## \`reduce\` over a promise chain

The cleanest approach uses \`Array.reduce\` to fold the tasks into a single promise chain:

\`\`\`js
tasks.reduce((chain, task) => chain.then(task), Promise.resolve())
\`\`\`

**How it works:**
- Start with \`Promise.resolve(undefined)\` — the seed value.
- For each task, \`.then(task)\` schedules it to run after the previous promise resolves, automatically passing the resolved value as the argument.
- If any promise rejects, \`.then\` short-circuits and the rejection propagates to the end.

This is the same pattern \`async/await\` compiles to — a flat chain of \`.then\` calls. The \`reduce\` version is useful when you have a dynamic array of tasks.

An equivalent \`for...of\` + \`await\` loop works identically:
\`\`\`js
let result;
for (const task of tasks) result = await task(result);
return result;
\`\`\``,
      code: `function chainAsync(tasks) {
  return tasks.reduce(
    (chain, task) => chain.then(task),
    Promise.resolve(undefined),
  );
}`,
    },
  ],
};
