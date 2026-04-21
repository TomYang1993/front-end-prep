import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const closurePrivateCounter: SeedQuestion = {
  slug: 'closure-private-counter',
  title: 'Private Counter with Closures',
  prompt: `Implement \`createCounter(initialValue)\` that returns an object with four methods, all sharing **private** state via closure:

| Method | Behaviour |
|---|---|
| \`increment()\` | Add 1, return new value |
| \`decrement()\` | Subtract 1, return new value |
| \`reset()\` | Restore to \`initialValue\`, return it |
| \`getCount()\` | Return current value without changing it |

**Key constraint:** The internal count must **not** be accessible as a property — only through the returned methods. \`counter.count\` (or any other direct property) should be \`undefined\`.

\`\`\`js
const counter = createCounter(10);
counter.increment(); // 11
counter.increment(); // 12
counter.decrement(); // 11
counter.getCount();  // 11
counter.reset();     // 10
\`\`\`

Each call to \`createCounter\` must produce an **independent** counter — modifying one should not affect another.`,
  description: 'Build a counter factory using closures to encapsulate private state with increment, decrement, reset, and getCount.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.EASY,
  accessTier: AccessTier.FREE,
  tags: ['closure', 'encapsulation'],
  starterCode: {
    javascript: `function createCounter(initialValue) {
  // Use closure to keep count private
}`,
    typescript: `interface Counter {
  increment(): number;
  decrement(): number;
  reset(): number;
  getCount(): number;
}

function createCounter(initialValue: number): Counter {
  // Use closure to keep count private
}`,
  },
  publicTestCode: `test('increment returns updated count', () => {
  const c = createCounter(0);
  expect(c.increment()).toBe(1);
  expect(c.increment()).toBe(2);
});

test('decrement returns updated count', () => {
  const c = createCounter(5);
  expect(c.decrement()).toBe(4);
  expect(c.decrement()).toBe(3);
});

test('getCount returns current value without mutation', () => {
  const c = createCounter(7);
  c.increment();
  expect(c.getCount()).toBe(8);
  expect(c.getCount()).toBe(8);
});`,
  hiddenTestCode: `test('reset restores to initial value', () => {
  const c = createCounter(10);
  c.increment();
  c.increment();
  c.increment();
  expect(c.reset()).toBe(10);
  expect(c.getCount()).toBe(10);
});

test('count is truly private — no direct property access', () => {
  const c = createCounter(0);
  expect(c.count).toBeUndefined();
  expect(c.value).toBeUndefined();
  expect(c._count).toBeUndefined();
});

test('independent counters do not share state', () => {
  const a = createCounter(0);
  const b = createCounter(100);
  a.increment();
  a.increment();
  b.decrement();
  expect(a.getCount()).toBe(2);
  expect(b.getCount()).toBe(99);
});

test('works with negative initial values', () => {
  const c = createCounter(-5);
  expect(c.getCount()).toBe(-5);
  expect(c.increment()).toBe(-4);
  expect(c.reset()).toBe(-5);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## Closure as private scope

The returned object's methods close over \`count\` — a local variable that lives in \`createCounter\`'s scope. No property on the returned object holds the value, so external code cannot read or write it directly.

Each call to \`createCounter\` creates a **new** execution context with its own \`count\` and \`initial\`, which is why multiple counters are independent.

This is the Module Pattern — one of the most common real-world uses of closures in JavaScript.`,
      code: `function createCounter(initialValue) {
  let count = initialValue;
  return {
    increment() { return ++count; },
    decrement() { return --count; },
    reset() { count = initialValue; return count; },
    getCount() { return count; },
  };
}`,
    },
  ],
};
