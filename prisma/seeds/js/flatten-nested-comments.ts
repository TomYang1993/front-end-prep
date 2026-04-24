import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const flattenNestedComments: SeedQuestion = {
  slug: 'flatten-nested-comments',
  title: 'Flatten Nested Comments',
  prompt: `Given a nested comment tree, return a flat array of all comment texts in **depth-first** order.

\`\`\`js
const comments = [
  { text: 'Great post!', replies: [
    { text: 'Thanks!', replies: [] },
    { text: 'Agreed', replies: [
      { text: 'Same here', replies: [] }
    ]}
  ]},
  { text: 'Nice work', replies: [] }
];

flattenComments(comments)
// \u2192 ['Great post!', 'Thanks!', 'Agreed', 'Same here', 'Nice work']
\`\`\`

Each comment has a \`text\` (string) and \`replies\` (array of comments with the same shape). Traverse the tree depth-first: a comment's text comes before its replies.

**Why this matters:** Comment threads, org charts, file trees \u2014 any tree structure. Tests recursion + array methods together.`,
  description: 'Flatten a nested comment tree into a flat array using recursion.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['array', 'recursion'],
  starterCode: {
    javascript: `function flattenComments(comments) {
  // Return flat array of all comment texts, depth-first
}`,
    typescript: `interface Comment {
  text: string;
  replies: Comment[];
}

function flattenComments(comments: Comment[]): string[] {
  // Return flat array of all comment texts, depth-first
}`,
  },
  publicTestCode: `test('flattens nested comment tree', () => {
  const comments = [
    { text: 'Great post!', replies: [
      { text: 'Thanks!', replies: [] },
      { text: 'Agreed', replies: [
        { text: 'Same here', replies: [] }
      ]}
    ]},
    { text: 'Nice work', replies: [] }
  ];
  expect(flattenComments(comments)).toEqual([
    'Great post!', 'Thanks!', 'Agreed', 'Same here', 'Nice work'
  ]);
});

test('flat list with no replies', () => {
  const comments = [
    { text: 'A', replies: [] },
    { text: 'B', replies: [] }
  ];
  expect(flattenComments(comments)).toEqual(['A', 'B']);
});`,
  hiddenTestCode: `test('empty input', () => {
  expect(flattenComments([])).toEqual([]);
});

test('single comment no replies', () => {
  expect(flattenComments([{ text: 'solo', replies: [] }])).toEqual(['solo']);
});

test('deeply nested chain', () => {
  const comments = [
    { text: '1', replies: [
      { text: '2', replies: [
        { text: '3', replies: [
          { text: '4', replies: [] }
        ]}
      ]}
    ]}
  ];
  expect(flattenComments(comments)).toEqual(['1', '2', '3', '4']);
});

test('wide tree — many siblings', () => {
  const comments = [
    { text: 'root', replies: [
      { text: 'a', replies: [] },
      { text: 'b', replies: [] },
      { text: 'c', replies: [] },
      { text: 'd', replies: [] }
    ]}
  ];
  expect(flattenComments(comments)).toEqual(['root', 'a', 'b', 'c', 'd']);
});

test('mixed depth', () => {
  const comments = [
    { text: 'r1', replies: [
      { text: 'r1a', replies: [{ text: 'r1a1', replies: [] }] }
    ]},
    { text: 'r2', replies: [] },
    { text: 'r3', replies: [
      { text: 'r3a', replies: [] }
    ]}
  ];
  expect(flattenComments(comments)).toEqual(['r1', 'r1a', 'r1a1', 'r2', 'r3', 'r3a']);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## Recursive reduce (or flatMap)

For each comment, emit its \`text\`, then recursively flatten its \`replies\`.

**reduce version:**
\`\`\`js
comments.reduce((acc, c) => [...acc, c.text, ...flattenComments(c.replies)], [])
\`\`\`

**flatMap version (cleaner):**
\`\`\`js
comments.flatMap(c => [c.text, ...flattenComments(c.replies)])
\`\`\`

Both are depth-first: a comment's text appears before its replies' texts. The \`flatMap\` version avoids the intermediate spread into the accumulator, making it slightly more readable.`,
      code: `function flattenComments(comments) {
  return comments.flatMap(c => [c.text, ...flattenComments(c.replies)]);
}`,
    },
  ],
};
