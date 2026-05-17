import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const deepClone: SeedQuestion = {
  slug: 'deep-clone',
  title: 'Implement deepClone',
  prompt: `Implement \`deepClone(value)\` that returns a deep copy of \`value\`. The clone must satisfy every rule below — this is the kind of object real apps hand around (state trees, form models, cached responses):

\`\`\`js
const obj = {
  x: { y: { z: 6 }, r: Symbol('Tom') },
  a: function () { console.log('something'); },
  b: undefined,
  c: [1, 3, 6, 3, 6],
  d: 'we',
  e: true,
  f: { g: 'hello', h: { i: 'world', j: { k: { l: 'test' } } } },
  sub: {},
};

obj.circle = obj;       // circular reference
obj.sub.x = obj.x;      // aliased reference — sub.x and x point to the same inner object

const copy = deepClone(obj);
\`\`\`

**Rules:**
- Plain objects and arrays are recursively copied — nested levels are not shared with the input.
- Primitives (\`string\`, \`number\`, \`boolean\`, \`null\`, \`undefined\`, \`BigInt\`, \`Symbol\`) pass through unchanged.
- \`Date\` and \`RegExp\` instances produce fresh equivalent instances.
- **Symbol-keyed** properties are preserved.
- The **prototype** of each cloned object is preserved (\`copy instanceof Foo\` still holds).
- **Circular references** must not cause infinite recursion — \`copy.circle === copy\`.
- **Aliased references** must remain aliased after cloning — \`copy.sub.x === copy.x\` (one cloned inner object, two paths).
- Functions are copied **by reference** (don't try to clone function bodies).

**Forbidden:**
- \`JSON.parse(JSON.stringify(value))\` — drops symbols, \`undefined\`, functions; breaks \`Date\`; throws on cycles.
- \`structuredClone\` — that's the entire question.

> [!tip] Interview Tip
> Three ideas carry the whole solution: a \`WeakMap\` to remember \`input → output\` pairs (handles cycles **and** aliases in one stroke), \`Reflect.ownKeys\` to enumerate string **and** symbol keys, and \`Object.create(Object.getPrototypeOf(input))\` to preserve the prototype chain. Special-case \`Date\` / \`RegExp\` before generic object handling.
`,
  description: 'Recursively clone an object preserving cycles, aliases, symbols, prototypes, Date, and RegExp.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.HARD,
  accessTier: AccessTier.FREE,
  timeLimitMinutes: 60,
  tags: ['recursion', 'objects', 'coding taste'],
  starterCode: {
    javascript: `function deepClone(value) {
  // Support: nested objects/arrays, circular & aliased refs,
  // Symbol keys, Date, RegExp, prototype preservation.
  // No JSON.stringify or structuredClone.
}`,
    typescript: `function deepClone<T>(value: T): T {
  // Support: nested objects/arrays, circular & aliased refs,
  // Symbol keys, Date, RegExp, prototype preservation.
  // No JSON.stringify or structuredClone.
  return value;
}`,
  },
  publicTestCode: `test('clones nested object — values equal, refs independent', () => {
  const o = { x: { y: { z: 6 } }, c: [1, 2, 3] };
  const c = deepClone(o);
  expect(c).toEqual(o);
  expect(c).not.toBe(o);
  expect(c.x).not.toBe(o.x);
  expect(c.x.y).not.toBe(o.x.y);
  expect(c.c).not.toBe(o.c);
});

test('arrays remain arrays', () => {
  const c = deepClone([1, [2, [3]]]);
  expect(Array.isArray(c)).toBe(true);
  expect(Array.isArray(c[1])).toBe(true);
  expect(c).toEqual([1, [2, [3]]]);
});

test('primitives pass through', () => {
  expect(deepClone(42)).toBe(42);
  expect(deepClone('hello')).toBe('hello');
  expect(deepClone(null)).toBe(null);
  expect(deepClone(undefined)).toBe(undefined);
  expect(deepClone(true)).toBe(true);
});`,
  hiddenTestCode: `test('handles circular reference', () => {
  const o = { a: 1 };
  o.self = o;
  const c = deepClone(o);
  expect(c).not.toBe(o);
  expect(c.self).toBe(c);
  expect(c.a).toBe(1);
});

test('preserves aliased references', () => {
  const shared = { val: 'x' };
  const o = { a: shared, b: shared, sub: {} };
  o.sub.x = shared;
  const c = deepClone(o);
  expect(c.a).not.toBe(shared);
  expect(c.a).toBe(c.b);
  expect(c.sub.x).toBe(c.a);
});

test('preserves Symbol-keyed properties', () => {
  const k = Symbol('key');
  const o = { [k]: 'value', plain: 1 };
  const c = deepClone(o);
  expect(c[k]).toBe('value');
  expect(c.plain).toBe(1);
});

test('clones Date to a fresh instance', () => {
  const d = new Date('2024-01-15T10:00:00Z');
  const c = deepClone({ d });
  expect(c.d).not.toBe(d);
  expect(c.d instanceof Date).toBe(true);
  expect(c.d.getTime()).toBe(d.getTime());
});

test('clones RegExp to a fresh instance', () => {
  const r = /abc/gi;
  const c = deepClone({ r });
  expect(c.r).not.toBe(r);
  expect(c.r instanceof RegExp).toBe(true);
  expect(c.r.source).toBe('abc');
  expect(c.r.flags).toBe('gi');
});

test('functions are copied by reference', () => {
  const fn = () => 1;
  const c = deepClone({ fn });
  expect(c.fn).toBe(fn);
});

test('preserves prototype chain', () => {
  class Foo {
    constructor() { this.x = 1; }
    greet() { return 'hi'; }
  }
  const c = deepClone(new Foo());
  expect(c instanceof Foo).toBe(true);
  expect(c.greet()).toBe('hi');
});

test('preserves explicit undefined values', () => {
  const c = deepClone({ a: undefined });
  expect('a' in c).toBe(true);
  expect(c.a).toBeUndefined();
});

test('handles deeply nested object', () => {
  const o = { f: { g: 'hello', h: { i: 'world', j: { k: { l: 'test' } } } } };
  const c = deepClone(o);
  expect(c.f.h.j.k.l).toBe('test');
  expect(c.f.h.j.k).not.toBe(o.f.h.j.k);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## The three ideas

A correct \`deepClone\` is three small ideas stacked together:

1. **\`WeakMap\` from input → output** — solves cycles **and** aliases at once. Before recursing into an object, register the new clone in the map. If the same input ever shows up again, return the already-allocated clone.
2. **\`Reflect.ownKeys\`** — returns both string and symbol keys. \`Object.keys\` / \`for...in\` silently drop symbols.
3. **\`Object.create(Object.getPrototypeOf(input))\`** — produces an empty object with the same prototype, so \`clone instanceof Foo\` still holds.

Special-case \`Date\` and \`RegExp\` **before** the generic object branch — they're objects but iterating their own keys would miss their internal state.

## Why the WeakMap pulls double duty

\`\`\`js
obj.sub.x = obj.x;
\`\`\`

A naive recursive clone would visit \`obj.x\` twice — once via the \`x\` path, once via \`sub.x\` — and produce **two** independent clones. The original aliasing is lost. Worse: \`obj.circle = obj\` triggers infinite recursion.

The \`WeakMap\` fixes both. The first time we see \`obj.x\`, we create its clone and record \`map.set(obj.x, cloned)\`. The second visit reads from the map and returns the same \`cloned\` reference. Cycles fall out for free — when we hit \`obj\` again via \`obj.circle\`, the partially-built clone is already in the map.

\`Weak\` matters because the map shouldn't keep input objects alive past the clone call.

## Why functions stay by reference

Cloning a function body is impossible in JS without \`eval\` (and even then you'd lose its closure scope). Functions are values — copy by reference and move on. The same logic applies to opaque host objects like DOM nodes; this implementation just doesn't try.

## What \`JSON.parse(JSON.stringify(x))\` quietly drops

- \`undefined\` properties → removed
- \`Symbol\` keys & values → removed
- functions → removed
- \`Date\` → serialized to a string, prototype lost
- \`RegExp\` → \`{}\`
- cycles → \`TypeError: cyclic\`
- \`BigInt\` → \`TypeError\`
- prototype chain → flattened to \`Object.prototype\`

Useful as a quick "snapshot a plain JSON-shaped object" trick. Wrong for everything else.

## Note on the candidate's draft

Two bugs in the original snippet:

\`\`\`js
if (isObject(clone) && typeof test !== 'function') { ... }
\`\`\`

- \`typeof test\` should be \`typeof clone\` — \`test\` is undefined here.
- Re-assigning \`newObj[key] = dc(clone)\` after \`Object.create(..., getOwnPropertyDescriptors(obj))\` triggers a \`TypeError\` on any non-writable property (e.g. inherited from a frozen object). Building from \`Object.create(getPrototypeOf(obj))\` and writing fresh keys avoids that.`,
      code: `function deepClone(value) {
  const map = new WeakMap();

  function isObject(v) {
    return v !== null && typeof v === 'object';
  }

  function dc(input) {
    if (!isObject(input)) return input;

    if (input instanceof Date) return new Date(input.getTime());
    if (input instanceof RegExp) return new RegExp(input.source, input.flags);

    if (map.has(input)) return map.get(input);

    const out = Array.isArray(input)
      ? []
      : Object.create(Object.getPrototypeOf(input));

    map.set(input, out);

    for (const key of Reflect.ownKeys(input)) {
      const v = input[key];
      out[key] = typeof v === 'function' ? v : dc(v);
    }

    return out;
  }

  return dc(value);
}`,
    },
  ],
};
