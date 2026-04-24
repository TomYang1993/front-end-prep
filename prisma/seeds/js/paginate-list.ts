import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const paginateList: SeedQuestion = {
  slug: 'paginate-list',
  title: 'Paginate a List',
  prompt: `Write \`paginate(items, pageSize)\` that splits an array into pages (sub-arrays) of the given size. The last page may have fewer items.

\`\`\`js
paginate(['a', 'b', 'c', 'd', 'e'], 2)
// \u2192 [['a', 'b'], ['c', 'd'], ['e']]

paginate([1, 2, 3, 4, 5, 6], 3)
// \u2192 [[1, 2, 3], [4, 5, 6]]

paginate([1, 2, 3], 5)
// \u2192 [[1, 2, 3]]
\`\`\`

**Why this matters:** Pagination logic shows up in every list view. Tests your understanding of \`Math.ceil\`, \`slice\`, and array construction.`,
  description: 'Split an array into pages of a given size using Array.from and slice.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['array', 'pagination'],
  starterCode: {
    javascript: `function paginate(items, pageSize) {
  // Return an array of pages (sub-arrays)
}`,
    typescript: `function paginate<T>(items: T[], pageSize: number): T[][] {
  // Return an array of pages (sub-arrays)
}`,
  },
  publicTestCode: `test('splits into pages with remainder', () => {
  expect(paginate(['a', 'b', 'c', 'd', 'e'], 2)).toEqual([
    ['a', 'b'], ['c', 'd'], ['e']
  ]);
});

test('even split', () => {
  expect(paginate([1, 2, 3, 4, 5, 6], 3)).toEqual([
    [1, 2, 3], [4, 5, 6]
  ]);
});`,
  hiddenTestCode: `test('page size larger than array', () => {
  expect(paginate([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
});

test('page size of 1', () => {
  expect(paginate(['x', 'y', 'z'], 1)).toEqual([['x'], ['y'], ['z']]);
});

test('empty array', () => {
  expect(paginate([], 3)).toEqual([]);
});

test('single item', () => {
  expect(paginate([42], 10)).toEqual([[42]]);
});

test('page size equals array length', () => {
  expect(paginate([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
});

test('large page count', () => {
  const items = Array.from({ length: 10 }, (_, i) => i);
  const result = paginate(items, 3);
  expect(result).toEqual([[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## Array.from + slice

The trick: use \`Array.from\` with a computed length to create an array of pages, and a mapping function that slices the correct chunk.

\`\`\`js
Array.from(
  { length: Math.ceil(items.length / pageSize) },
  (_, i) => items.slice(i * pageSize, (i + 1) * pageSize)
)
\`\`\`

Key insight: \`Math.ceil(items.length / pageSize)\` gives the number of pages. Then each page \`i\` is \`items.slice(i * pageSize, (i + 1) * pageSize)\` — \`slice\` automatically clamps to the array length, so the last page works without special-casing.

Alternative: a \`for\` loop pushing slices — equally valid, just more imperative.`,
      code: `function paginate(items, pageSize) {
  return Array.from(
    { length: Math.ceil(items.length / pageSize) },
    (_, i) => items.slice(i * pageSize, (i + 1) * pageSize)
  );
}`,
    },
  ],
};
