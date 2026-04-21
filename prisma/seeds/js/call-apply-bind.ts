import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const callApplyBind: SeedQuestion = {
  slug: 'call-apply-bind',
  title: 'Implement call, apply, and bind',
  prompt: `Implement your own versions of \`Function.prototype.call\`, \`.apply\`, and \`.bind\` — three methods that control the \`this\` context of a function.

### myCall(context, ...args)

Invoke the function with \`this\` set to \`context\`, passing individual arguments.

\`\`\`js
function greet(greeting) { return greeting + ', ' + this.name; }
greet.myCall({ name: 'Alice' }, 'Hello'); // 'Hello, Alice'
\`\`\`

### myApply(context, argsArray)

Same as \`myCall\`, but takes arguments as an **array** (or \`null\`/\`undefined\` for no args).

\`\`\`js
greet.myApply({ name: 'Bob' }, ['Hi']); // 'Hi, Bob'
\`\`\`

### myBind(context, ...partialArgs)

Return a **new function** with \`this\` permanently bound to \`context\`. Partial arguments are prepended to any future call arguments.

\`\`\`js
const greetAlice = greet.myBind({ name: 'Alice' }, 'Hey');
greetAlice(); // 'Hey, Alice'
\`\`\`

### Rules
- Add these to \`Function.prototype\` so they work on any function
- \`myCall\` and \`myApply\` must invoke immediately; \`myBind\` must not
- If \`context\` is \`null\` or \`undefined\`, default to \`globalThis\``,
  description: 'Polyfill Function.prototype.call, apply, and bind from scratch.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['this', 'functions', 'prototype'],
  starterCode: {
    javascript: `Function.prototype.myCall = function (context, ...args) {
  // your code here
};

Function.prototype.myApply = function (context, argsArray) {
  // your code here
};

Function.prototype.myBind = function (context, ...partialArgs) {
  // your code here
};`,
    typescript: `// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Function {
  myCall(context: any, ...args: any[]): any;
  myApply(context: any, argsArray?: any[]): any;
  myBind(context: any, ...partialArgs: any[]): Function;
}

Function.prototype.myCall = function (context: any, ...args: any[]): any {
  // your code here
};

Function.prototype.myApply = function (context: any, argsArray?: any[]): any {
  // your code here
};

Function.prototype.myBind = function (context: any, ...partialArgs: any[]): Function {
  // your code here
};`,
  },
  publicTestCode: `test('myCall invokes with correct this and args', () => {
  function greet(greeting) { return greeting + ', ' + this.name; }
  expect(greet.myCall({ name: 'Alice' }, 'Hello')).toBe('Hello, Alice');
});

test('myApply invokes with correct this and args array', () => {
  function add(a, b) { return this.base + a + b; }
  expect(add.myApply({ base: 10 }, [1, 2])).toBe(13);
});

test('myBind returns a bound function', () => {
  function greet(greeting) { return greeting + ', ' + this.name; }
  const fn = greet.myBind({ name: 'Bob' });
  expect(fn('Hi')).toBe('Hi, Bob');
});`,
  hiddenTestCode: `test('myCall with multiple arguments', () => {
  function sum(a, b, c) { return this.start + a + b + c; }
  expect(sum.myCall({ start: 100 }, 1, 2, 3)).toBe(106);
});

test('myApply with no arguments', () => {
  function getName() { return this.name; }
  expect(getName.myApply({ name: 'Charlie' })).toBe('Charlie');
  expect(getName.myApply({ name: 'Charlie' }, null)).toBe('Charlie');
});

test('myBind partial application — prepends args', () => {
  function add(a, b, c) { return a + b + c; }
  const addFive = add.myBind(null, 5);
  expect(addFive(10, 20)).toBe(35);
});

test('myBind preserves context across multiple calls', () => {
  function getCount() { return this.count; }
  const bound = getCount.myBind({ count: 42 });
  expect(bound()).toBe(42);
  expect(bound()).toBe(42);
});

test('myCall with null context does not throw', () => {
  function identity(x) { return x; }
  expect(identity.myCall(null, 99)).toBe(99);
});

test('myBind chained partial args', () => {
  function join(a, b, c, d) { return [a, b, c, d].join('-'); }
  const partial = join.myBind(null, 'a', 'b');
  expect(partial('c', 'd')).toBe('a-b-c-d');
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## The Symbol trick for \`myCall\` / \`myApply\`

To invoke a function with a specific \`this\`, temporarily attach it as a method on the context object using a unique Symbol (avoids name collisions), call it, then delete it:

\`\`\`js
const key = Symbol();
context[key] = this;   // "this" is the function being called
const result = context[key](...args);
delete context[key];
\`\`\`

When a function is called as \`obj.method()\`, \`this\` inside equals \`obj\` — that's the mechanism we exploit.

## \`myBind\`

Returns a closure that merges partial args with call-time args and delegates to \`myApply\`. The closure captures \`context\` and \`partialArgs\` permanently.`,
      code: `Function.prototype.myCall = function (context, ...args) {
  context = context ?? globalThis;
  const key = Symbol();
  context[key] = this;
  const result = context[key](...args);
  delete context[key];
  return result;
};

Function.prototype.myApply = function (context, argsArray) {
  return this.myCall(context, ...(argsArray || []));
};

Function.prototype.myBind = function (context, ...partialArgs) {
  const fn = this;
  return function (...args) {
    return fn.myApply(context, partialArgs.concat(args));
  };
};`,
    },
  ],
};
