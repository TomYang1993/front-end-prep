import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const functionCurry: SeedQuestion = {
  slug: 'function-curry',
  title: 'Curry Function',
  prompt: `Implement \`curry(fn)\` that transforms a function so it can be called with arguments **one at a time** (or in groups) until all expected arguments are provided, then executes the original function.

\`\`\`js
function add(a, b, c) { return a + b + c; }

const curriedAdd = curry(add);

// All equivalent — returns 6:
curriedAdd(1, 2, 3);
curriedAdd(1)(2, 3);
curriedAdd(1)(2)(3);
curriedAdd(1, 2)(3);
\`\`\`

### Requirements

1. Use \`fn.length\` to determine the expected argument count (arity).
2. If enough arguments are provided, call \`fn\` immediately and return the result.
3. If fewer arguments are provided, return a new function that accepts the remaining ones.
4. The original function should be called with the correct \`this\` context if invoked as a method.`,
  description: 'Implement a generic curry utility that progressively collects arguments until the function arity is met.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['closure', 'functions'],
  starterCode: {
    javascript: `function curry(fn) {
  // your code here
}`,
    typescript: `function curry(fn: Function): Function {
  // your code here
}`,
  },
  publicTestCode: `test('calls immediately when all args provided at once', () => {
  const add = (a, b, c) => a + b + c;
  expect(curry(add)(1, 2, 3)).toBe(6);
});

test('works with one arg at a time', () => {
  const add = (a, b, c) => a + b + c;
  expect(curry(add)(1)(2)(3)).toBe(6);
});

test('works with mixed arg groups', () => {
  const add = (a, b, c) => a + b + c;
  expect(curry(add)(1, 2)(3)).toBe(6);
  expect(curry(add)(1)(2, 3)).toBe(6);
});`,
  hiddenTestCode: `test('works with single-arg function', () => {
  const identity = (x) => x;
  expect(curry(identity)(42)).toBe(42);
});

test('works with two-arg function', () => {
  const multiply = (a, b) => a * b;
  expect(curry(multiply)(3)(7)).toBe(21);
  expect(curry(multiply)(3, 7)).toBe(21);
});

test('handles string arguments', () => {
  const join = (a, b, c) => [a, b, c].join('-');
  expect(curry(join)('a')('b')('c')).toBe('a-b-c');
});

test('each partial application returns a new function', () => {
  const add = (a, b, c) => a + b + c;
  const addOne = curry(add)(1);
  expect(addOne(2, 3)).toBe(6);
  expect(addOne(10, 20)).toBe(31);
});

test('preserves this context', () => {
  const obj = {
    base: 10,
    add: curry(function(a, b) { return this.base + a + b; }),
  };
  expect(obj.add(1)(2)).toBe(13);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## Recursive partial application

The core idea: return a wrapper that collects arguments. If we have enough (\`args.length >= fn.length\`), call \`fn\`. Otherwise, return a new function that appends fresh args and recurses.

\`fn.length\` gives the number of declared parameters (the arity). Each partial call spreads accumulated args plus new args, converging toward the arity.

The \`this\` context is preserved by using \`fn.apply(this, args)\` instead of \`fn(...args)\`.`,
      code: `function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function (...moreArgs) {
      return curried.apply(this, args.concat(moreArgs));
    };
  };
}`,
    },
  ],
};
