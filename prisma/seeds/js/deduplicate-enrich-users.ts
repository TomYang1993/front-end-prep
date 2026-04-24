import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const deduplicateEnrichUsers: SeedQuestion = {
  slug: 'deduplicate-enrich-users',
  title: 'Deduplicate and Enrich User List',
  prompt: `You fetched users from two APIs and some are duplicates (same \`email\`). Merge them into one list with **no duplicates**, and add an \`initials\` field derived from the name.

\`\`\`js
const apiA = [
  { email: 'alice@x.com', name: 'Alice Chen' },
  { email: 'bob@x.com', name: 'Bob Lee' }
];
const apiB = [
  { email: 'bob@x.com', name: 'Bob Lee' },
  { email: 'carol@x.com', name: 'Carol Kim' }
];

mergeUsers(apiA, apiB)
// \u2192 [
//   { email: 'alice@x.com', name: 'Alice Chen', initials: 'AC' },
//   { email: 'bob@x.com', name: 'Bob Lee', initials: 'BL' },
//   { email: 'carol@x.com', name: 'Carol Kim', initials: 'CK' }
// ]
\`\`\`

**Rules:**
- Deduplicate by \`email\` — if the same email appears in both lists, keep only one copy.
- \`initials\` = first letter of each word in \`name\`, concatenated (e.g. \`'Alice Chen'\` \u2192 \`'AC'\`).
- Preserve the order: all of \`apiA\` first, then unique entries from \`apiB\`.

**Why this matters:** Merging data from multiple sources is daily frontend work.`,
  description: 'Merge two user arrays, deduplicate by email, and add computed initials.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['array', 'objects'],
  starterCode: {
    javascript: `function mergeUsers(apiA, apiB) {
  // Merge, deduplicate by email, add initials
}`,
    typescript: `interface User {
  email: string;
  name: string;
}

interface EnrichedUser extends User {
  initials: string;
}

function mergeUsers(apiA: User[], apiB: User[]): EnrichedUser[] {
  // Merge, deduplicate by email, add initials
}`,
  },
  publicTestCode: `test('merges and deduplicates two user lists', () => {
  const apiA = [
    { email: 'alice@x.com', name: 'Alice Chen' },
    { email: 'bob@x.com', name: 'Bob Lee' }
  ];
  const apiB = [
    { email: 'bob@x.com', name: 'Bob Lee' },
    { email: 'carol@x.com', name: 'Carol Kim' }
  ];
  expect(mergeUsers(apiA, apiB)).toEqual([
    { email: 'alice@x.com', name: 'Alice Chen', initials: 'AC' },
    { email: 'bob@x.com', name: 'Bob Lee', initials: 'BL' },
    { email: 'carol@x.com', name: 'Carol Kim', initials: 'CK' }
  ]);
});

test('no duplicates between lists', () => {
  const apiA = [{ email: 'a@x.com', name: 'Ada Lovelace' }];
  const apiB = [{ email: 'b@x.com', name: 'Bob Smith' }];
  expect(mergeUsers(apiA, apiB)).toEqual([
    { email: 'a@x.com', name: 'Ada Lovelace', initials: 'AL' },
    { email: 'b@x.com', name: 'Bob Smith', initials: 'BS' }
  ]);
});`,
  hiddenTestCode: `test('empty first list', () => {
  const apiB = [{ email: 'x@x.com', name: 'Xi Wang' }];
  expect(mergeUsers([], apiB)).toEqual([
    { email: 'x@x.com', name: 'Xi Wang', initials: 'XW' }
  ]);
});

test('empty second list', () => {
  const apiA = [{ email: 'x@x.com', name: 'Xi Wang' }];
  expect(mergeUsers(apiA, [])).toEqual([
    { email: 'x@x.com', name: 'Xi Wang', initials: 'XW' }
  ]);
});

test('both empty', () => {
  expect(mergeUsers([], [])).toEqual([]);
});

test('all duplicates', () => {
  const users = [{ email: 'a@b.com', name: 'Jo Mo' }];
  expect(mergeUsers(users, users)).toEqual([
    { email: 'a@b.com', name: 'Jo Mo', initials: 'JM' }
  ]);
});

test('single-word name', () => {
  const apiA = [{ email: 'prince@x.com', name: 'Prince' }];
  expect(mergeUsers(apiA, [])).toEqual([
    { email: 'prince@x.com', name: 'Prince', initials: 'P' }
  ]);
});

test('three-word name', () => {
  const apiA = [{ email: 'mlk@x.com', name: 'Martin Luther King' }];
  expect(mergeUsers(apiA, [])).toEqual([
    { email: 'mlk@x.com', name: 'Martin Luther King', initials: 'MLK' }
  ]);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## Spread + filter + some + map

Three steps:
1. **Merge:** spread both arrays, but filter \`apiB\` to remove entries whose email already exists in \`apiA\`.
2. **Enrich:** map over the merged list, adding \`initials\` by splitting the name and taking the first character of each word.

\`\`\`js
const merged = [...apiA, ...apiB.filter(b => !apiA.some(a => a.email === b.email))];
\`\`\`

This tests multiple array methods in composition — a very common real-world pattern when aggregating data from multiple API responses.`,
      code: `function mergeUsers(apiA, apiB) {
  const merged = [...apiA, ...apiB.filter(b => !apiA.some(a => a.email === b.email))];
  return merged.map(u => ({
    ...u,
    initials: u.name.split(' ').map(w => w[0]).join('')
  }));
}`,
    },
  ],
};
