import { QuestionType, Difficulty, AccessTier } from "@prisma/client";
import type { SeedQuestion } from "../types";

export const closureSetTimeoutTrap: SeedQuestion = {
  slug: "closure-settimeout-trap",
  title: "Fix the delayedLog Function",
  prompt: `
The function \`delayedLog(n)\` should return an array of \`n\` functions. When called, the \`i\`-th function returns a \`Promise\` that resolves to \`i\` after a short \`setTimeout\` delay.

Looks fine on a quick read, but is the output correct?

**Your task:** Implement \`delayedLog(n)\` so each function's Promise resolves to its own index.

\`\`\`js
const fns = delayedLog(3);
await Promise.all(fns.map(fn => fn())); // => [0, 1, 2]
await fns[1]();                         // => 1
\`\`\`
`,
  description:
    "Fix the classic closure bug where setTimeout callbacks all capture the same variable.",
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.EASY,
  accessTier: AccessTier.FREE,
  timeLimitMinutes: 15,
  tags: ["closure", "scope", "coding taste"],
  starterCode: {
    javascript: `function delayedLog(n) {
  const fns = [];
  for (var i = 0; i < n; i++) {
    fns.push(function () {
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve(i);
        }, 10);
      });
    });
  }
  return fns;
}

`,
    typescript: `function delayedLog(n: number): (() => Promise<number>)[] {
  const fns: (() => Promise<number>)[] = [];
  for (var i = 0; i < n; i++) {
    fns.push(function () {
      return new Promise<number>(function (resolve) {
        setTimeout(function () {
          resolve(i);
        }, 10);
      });
    });
  }
  return fns;
}`,
  },
  publicTestCode: `test('each function resolves to its own index', async () => {
  const fns = delayedLog(3);
  await expect(fns[0]()).resolves.toBe(0);
  await expect(fns[1]()).resolves.toBe(1);
  await expect(fns[2]()).resolves.toBe(2);
});

test('works with n = 5', async () => {
  const results = await Promise.all(delayedLog(5).map(fn => fn()));
  expect(results).toEqual([0, 1, 2, 3, 4]);
});`,
  hiddenTestCode: `test('n = 0 returns empty array', () => {
  expect(delayedLog(0)).toEqual([]);
});

test('n = 1 resolves to [0]', async () => {
  const results = await Promise.all(delayedLog(1).map(fn => fn()));
  expect(results).toEqual([0]);
});

test('n = 10 covers larger range', async () => {
  const results = await Promise.all(delayedLog(10).map(fn => fn()));
  expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test('functions are independent — calling one does not affect others', async () => {
  const fns = delayedLog(4);
  await expect(fns[3]()).resolves.toBe(3);
  await expect(fns[0]()).resolves.toBe(0);
  await expect(fns[2]()).resolves.toBe(2);
});

test('returns a real Promise (uses async timing)', () => {
  const fn = delayedLog(1)[0];
  expect(typeof fn().then).toBe('function');
});`,
  solutions: [
    {
      language: "javascript",
      explanation: `## Why it breaks

The \`setTimeout\` callback doesn't run until **after** the \`for\` loop finishes. By then \`var i\` (one binding shared by every iteration) — equals \`n\`. Every Promise resolves to \`n\`.

The \`function (resolve)\` wrapper and the inner \`function ()\` callback both look like fresh scopes, but they don't help: they just capture \`i\` by reference, and there's only one \`i\`.

## Three classic fixes

### 1. \`let\`
\`let\` is block-scoped, so each iteration gets its own \`i\`:
\`\`\`js
for (let i = 0; i < n; i++) {
  fns.push(() => new Promise(r => setTimeout(() => r(i), 10)));
}
\`\`\`

### 2. IIFE
Capture \`i\` by value through a parameter:
\`\`\`js
for (var i = 0; i < n; i++) {
  (function (j) {
    fns.push(() => new Promise(r => setTimeout(() => r(j), 10)));
  })(i);
}
\`\`\`

### 3. \`bind\`
Pre-bind the index, the essence is the same, capture the  \`i\` by value:
\`\`\`js
for (var i = 0; i < n; i++) {
  fns.push(function (j) {
    return new Promise(r => setTimeout(() => r(j), 10));
  }.bind(null, i));
}
\`\`\`

whichever way works, showing the way using \`let\` keyword

## Full Implementation`,
      code: `function delayedLog(n) {
  const fns = [];
  for (let i = 0; i < n; i++) {
    fns.push(() => new Promise(resolve => {
      setTimeout(() => resolve(i), 10);
    }));
  }
  return fns;
}`,
    },
  ],
};
