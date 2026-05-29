import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const functionCurry: SeedQuestion = {
  slug: 'function-curry',
  title: 'Curry Function',
  prompt: `Implement \`curry(fn)\` that transforms a function so it can be called with arguments **one at a time** (or in groups) until all expected arguments are provided, then executes the original function.

\`\`\`js
function add(a, b, c) { return a + b + c; }

// curry returns a function which it can be called in a chain
const curriedAdd = curry(add);

// All equivalent — returns 6:
curriedAdd(1, 2, 3);
curriedAdd(1)(2, 3);
curriedAdd(1)(2)(3);
curriedAdd(1, 2)(3);
\`\`\`

### Rules
1. The original function should be called with the correct \`this\` context if invoked as a method.

> [!info] interview inspiration
> In modern JS, arrow fns (x => f(a, x)) cover most cases curry function used to do. Curry shines in Ramda/lodash-fp style codebases, Haskell-influenced libs, or when you want named partial applications as first-class values. Interview asks for it because it tests closures, recursion, rest args in a full set, so it's quite classic!
`,
  description: 'Implement a generic curry utility that progressively collects arguments until the function arity is met.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  timeLimitMinutes: 30,
  tags: ['closure', 'functions'],
  starterCode: {
    javascript: `function curry(fn) {
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

## Preserving \`this\` through the chain

When \`curry\` is used as a method (\`obj.add(1)(2)\`), only the **first** call has \`this\` bound to \`obj\` — the JS engine binds \`this\` based on the call site. The follow-up call \`(2)\` is a free invocation, so its \`this\` is \`undefined\` (strict) or the global object.

To keep \`this\` flowing across chained calls, the inner partial **must be an arrow function** so it closes over the lexical \`this\` from the outer \`curried\` invocation:

\`\`\`js
return (...moreArgs) => curried.apply(this, args.concat(moreArgs));
\`\`\`

A regular \`function (...moreArgs) { ... }\` would get its own \`this\` on each call and silently drop the method receiver, so \`fn.apply(this, args)\` at the end would fire with \`this === undefined\` and \`this.base\` would throw.

## Full Implementation`,
      code: `function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return (...moreArgs) => curried.apply(this, args.concat(moreArgs));
  };
}`,
    },
  ],
};
