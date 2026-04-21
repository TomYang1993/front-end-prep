import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const closureSetTimeoutTrap: SeedQuestion = {
  slug: 'closure-settimeout-trap',
  title: 'Fix the setTimeout Loop',
  prompt: `A common interview classic: the \`for\` loop with \`setTimeout\`.

The function \`delayedLog(n)\` should return an array of \`n\` functions. When called, the \`i\`-th function (0-indexed) should return \`i\` after a brief delay.

**Broken version (for reference):**
\`\`\`js
function delayedLog(n) {
  const fns = [];
  for (var i = 0; i < n; i++) {
    fns.push(function () { return i; });
  }
  return fns;
}
// delayedLog(3).map(fn => fn()) => [3, 3, 3]  // Bug!
\`\`\`

Every function returns \`n\` instead of its own index because \`var\` is function-scoped — they all close over the **same** \`i\`.

**Your task:** Implement \`delayedLog(n)\` so that each function correctly returns its own index.

\`\`\`js
delayedLog(3).map(fn => fn()) // => [0, 1, 2]
delayedLog(5)[3]()            // => 3
\`\`\`

You may use any approach: \`let\`, IIFE, \`bind\`, closures, etc.`,
  description: 'Fix the classic var/closure bug where setTimeout callbacks all capture the same variable.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.EASY,
  accessTier: AccessTier.FREE,
  tags: ['closure', 'scope'],
  starterCode: {
    javascript: `function delayedLog(n) {
  const fns = [];
  // Fix the closure bug so each function returns its own index
  for (var i = 0; i < n; i++) {
    fns.push(function () { return i; });
  }
  return fns;
}`,
    typescript: `function delayedLog(n: number): (() => number)[] {
  const fns: (() => number)[] = [];
  // Fix the closure bug so each function returns its own index
  for (var i = 0; i < n; i++) {
    fns.push(function () { return i; });
  }
  return fns;
}`,
  },
  publicTestCode: `test('each function returns its own index', () => {
  const fns = delayedLog(3);
  expect(fns[0]()).toBe(0);
  expect(fns[1]()).toBe(1);
  expect(fns[2]()).toBe(2);
});

test('works with n = 5', () => {
  const results = delayedLog(5).map(fn => fn());
  expect(results).toEqual([0, 1, 2, 3, 4]);
});`,
  hiddenTestCode: `test('n = 0 returns empty array', () => {
  expect(delayedLog(0)).toEqual([]);
});

test('n = 1 returns [0]', () => {
  expect(delayedLog(1).map(fn => fn())).toEqual([0]);
});

test('n = 10 covers larger range', () => {
  const results = delayedLog(10).map(fn => fn());
  expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test('functions are independent — calling one does not affect others', () => {
  const fns = delayedLog(4);
  expect(fns[3]()).toBe(3);
  expect(fns[0]()).toBe(0);
  expect(fns[2]()).toBe(2);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## Three classic fixes

### 1. \`let\` (simplest)
\`let\` is block-scoped, so each iteration creates a fresh binding:
\`\`\`js
for (let i = 0; i < n; i++) { fns.push(() => i); }
\`\`\`

### 2. IIFE
Wrap the push in an immediately-invoked function to capture \`i\` by value:
\`\`\`js
for (var i = 0; i < n; i++) {
  (function(j) { fns.push(() => j); })(i);
}
\`\`\`

### 3. \`bind\`
Use \`bind\` to partially apply the value:
\`\`\`js
for (var i = 0; i < n; i++) {
  fns.push(function(j) { return j; }.bind(null, i));
}
\`\`\`

All three solve the same root cause: \`var\` is function-scoped, so all closures share one \`i\`. Each fix creates a per-iteration binding.`,
      code: `function delayedLog(n) {
  const fns = [];
  for (let i = 0; i < n; i++) {
    fns.push(() => i);
  }
  return fns;
}`,
    },
  ],
};
