import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const customArrayPush: SeedQuestion = {
  slug: 'custom-array-push',
  title: 'Implement Array.prototype.push',
  prompt: `Implement a custom version of \`Array.prototype.push\` called \`customPush\`.

It should behave exactly like the native \`push\`:
- Accept any number of arguments
- Append each argument to the end of the array
- Update the \`length\` property
- Return the **new length**

\`\`\`js
const arr = [1, 2, 3];
arr.customPush(4, 5);
// arr is now [1, 2, 3, 4, 5]
// returns 5
\`\`\`

**Requirements:**
- Do NOT use the native \`push\`, \`splice\`, \`concat\`, or spread into \`this\`.
- Handle the array as a generic object — use \`this.length\` to find the insertion index.
- Use the unsigned right shift (\`>>> 0\`) to coerce \`length\` to a valid 32-bit unsigned integer (this is what the spec requires).
- Throw a \`TypeError\` if the resulting length would exceed \`2^53 - 1\` (the max safe array length).

**Why this matters:** Re-implementing built-in methods tests deep understanding of how JS arrays work under the hood — they're just objects with a special \`length\` property. This question surfaces knowledge of \`this\` binding, the \`arguments\`/rest pattern, the \`>>> 0\` idiom, and prototype methods.`,
  description: 'Reimplement Array.prototype.push from scratch — tests prototype methods, this binding, and the >>> 0 idiom.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['prototype', 'array'],
  starterCode: {
    javascript: `Array.prototype.customPush = function (...args) {
  // Implement push from scratch — no native push/splice/concat
};

// Test helper — do not modify
function testPush(initial, ...pushArgs) {
  const arr = [...initial];
  const newLen = arr.customPush(...pushArgs);
  return { arr, newLen };
}`,
    typescript: `interface Array<T> {
  customPush(...items: T[]): number;
}

Array.prototype.customPush = function (...args: unknown[]): number {
  // Implement push from scratch — no native push/splice/concat
  return 0;
};

// Test helper — do not modify
function testPush(initial: unknown[], ...pushArgs: unknown[]): { arr: unknown[]; newLen: number } {
  const arr = [...initial];
  const newLen = arr.customPush(...pushArgs);
  return { arr, newLen };
}`,
  },
  publicTestCode: `test('pushes single element', () => {
  const { arr, newLen } = testPush([1, 2, 3], 4);
  expect(arr).toEqual([1, 2, 3, 4]);
  expect(newLen).toBe(4);
});

test('pushes multiple elements', () => {
  const { arr, newLen } = testPush([1], 2, 3, 4);
  expect(arr).toEqual([1, 2, 3, 4]);
  expect(newLen).toBe(4);
});

test('pushes to empty array', () => {
  const { arr, newLen } = testPush([], 'a', 'b');
  expect(arr).toEqual(['a', 'b']);
  expect(newLen).toBe(2);
});`,
  hiddenTestCode: `test('returns new length', () => {
  const { newLen } = testPush([1, 2], 3);
  expect(newLen).toBe(3);
});

test('pushing zero elements returns current length', () => {
  const { arr, newLen } = testPush([1, 2, 3]);
  expect(arr).toEqual([1, 2, 3]);
  expect(newLen).toBe(3);
});

test('handles mixed types', () => {
  const { arr } = testPush([], 1, 'two', null, undefined, { x: 3 });
  expect(arr).toEqual([1, 'two', null, undefined, { x: 3 }]);
});

test('handles nested arrays', () => {
  const { arr } = testPush([[1]], [2, 3]);
  expect(arr).toEqual([[1], [2, 3]]);
});

test('sequential pushes accumulate', () => {
  const arr = [1];
  arr.customPush(2);
  arr.customPush(3, 4);
  expect(arr).toEqual([1, 2, 3, 4]);
  expect(arr.length).toBe(4);
});

test('works on array-like objects via call', () => {
  const obj = { length: 2, 0: 'a', 1: 'b' };
  const newLen = Array.prototype.customPush.call(obj, 'c');
  expect(newLen).toBe(3);
  expect(obj[2]).toBe('c');
  expect(obj.length).toBe(3);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## How arrays really work in JS

Arrays in JavaScript are objects with:
- Numeric string keys (\`"0"\`, \`"1"\`, ...)
- A magic \`length\` property that auto-updates

So \`push\` is really just:
1. Read \`this.length\`
2. Assign each new element at index \`length + i\`
3. Update \`length\`
4. Return the new length

### Key details:
- **\`Object(this)\`** — ensures it works even if called on a primitive (spec compliance)
- **\`>>> 0\`** — unsigned right shift coerces \`length\` to a 32-bit unsigned integer, matching the spec's ToUint32 behavior. Handles \`undefined\`, \`NaN\`, negative numbers, and floats.
- **\`2^53 - 1\` check** — \`Number.MAX_SAFE_INTEGER\` is the max array length in the spec
- **\`.call(obj, ...)\`** — because we use \`this\`, the method works on any array-like object, not just actual arrays

This question reveals whether a candidate understands that arrays are "just objects" and knows the prototype method contract.`,
      code: `Array.prototype.customPush = function (...args) {
  let obj = Object(this);
  let len = this.length >>> 0;
  let addedLen = args.length >>> 0;

  if (len + addedLen > 2 ** 53 - 1) {
    throw new TypeError("the number of array elements exceeds the maximum!");
  }

  for (let i = 0; i < addedLen; i++) {
    obj[i + len] = args[i];
  }

  let newLen = len + addedLen;
  obj.length = newLen;
  return newLen;
};

function testPush(initial, ...pushArgs) {
  const arr = [...initial];
  const newLen = arr.customPush(...pushArgs);
  return { arr, newLen };
}`,
    },
  ],
};
