import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const buildLookupTable: SeedQuestion = {
  slug: 'build-lookup-table',
  title: 'Build a Lookup Table from an Array',
  prompt: `Given a list of products, build an object keyed by \`id\` for O(1) lookups.

\`\`\`js
const products = [
  { id: 'p1', name: 'Widget', price: 25 },
  { id: 'p2', name: 'Gadget', price: 80 },
  { id: 'p3', name: 'Gizmo', price: 15 }
];

toLookup(products)
// \u2192 {
//   p1: { id: 'p1', name: 'Widget', price: 25 },
//   p2: { id: 'p2', name: 'Gadget', price: 80 },
//   p3: { id: 'p3', name: 'Gizmo', price: 15 }
// }
\`\`\`

**Why this matters:** This is the single most common \`reduce\` pattern in real React/Redux code — converting arrays to normalized maps for fast access by ID.`,
  description: 'Convert an array of objects into a lookup object keyed by id using reduce.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.EASY,
  accessTier: AccessTier.FREE,
  tags: ['array', 'reduce'],
  starterCode: {
    javascript: `function toLookup(items) {
  // Return an object keyed by item.id
}`,
    typescript: `interface Item {
  id: string;
  [key: string]: unknown;
}

function toLookup<T extends Item>(items: T[]): Record<string, T> {
  // Return an object keyed by item.id
}`,
  },
  publicTestCode: `test('converts product array to lookup object', () => {
  const products = [
    { id: 'p1', name: 'Widget', price: 25 },
    { id: 'p2', name: 'Gadget', price: 80 },
    { id: 'p3', name: 'Gizmo', price: 15 }
  ];
  expect(toLookup(products)).toEqual({
    p1: { id: 'p1', name: 'Widget', price: 25 },
    p2: { id: 'p2', name: 'Gadget', price: 80 },
    p3: { id: 'p3', name: 'Gizmo', price: 15 }
  });
});

test('single item', () => {
  expect(toLookup([{ id: 'x', val: 42 }])).toEqual({
    x: { id: 'x', val: 42 }
  });
});`,
  hiddenTestCode: `test('empty array returns empty object', () => {
  expect(toLookup([])).toEqual({});
});

test('preserves all properties', () => {
  const items = [{ id: 'a', foo: 1, bar: 'baz', nested: { x: true } }];
  const result = toLookup(items);
  expect(result.a).toEqual({ id: 'a', foo: 1, bar: 'baz', nested: { x: true } });
});

test('last duplicate id wins', () => {
  const items = [
    { id: 'dup', version: 1 },
    { id: 'dup', version: 2 }
  ];
  expect(toLookup(items)).toEqual({ dup: { id: 'dup', version: 2 } });
});

test('numeric-like ids work', () => {
  const items = [
    { id: '1', name: 'one' },
    { id: '2', name: 'two' }
  ];
  expect(toLookup(items)).toEqual({
    '1': { id: '1', name: 'one' },
    '2': { id: '2', name: 'two' }
  });
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## reduce into an object

The classic pattern: accumulate into an object, using each item's \`id\` as the key.

\`\`\`js
items.reduce((acc, item) => { acc[item.id] = item; return acc; }, {})
\`\`\`

Alternatives:
- \`Object.fromEntries(items.map(i => [i.id, i]))\` — more declarative but allocates an intermediate array of pairs.
- A \`for...of\` loop — equally valid, just more imperative.

This pattern is foundational in state management (Redux normalizedState, React Query caching, etc.).`,
      code: `function toLookup(items) {
  return items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}`,
    },
  ],
};
