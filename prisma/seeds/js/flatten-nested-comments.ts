import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const flattenNestedComments: SeedQuestion = {
  slug: 'flatten-nested-comments',
  title: 'Flatten Nested Comments',
  prompt: `You're rendering a Reddit-style comment thread. The UI indents replies by depth and limits how deep it shows — anything past the limit collapses behind a "Show more replies" button. We only focus on the possible returned data here.

Given a nested comment tree and a \`maxDepth\`, return a flat array of items the UI can render directly:

\`\`\`text
{ text: string, depth: number, hasHiddenReplies: boolean }
\`\`\`

- \`depth 0\` is top level and should be always included
- \`maxDepth\` >= 1
- \`hasHiddenReplies\` — \`true\` only when a comment has replies that were cut off by \`maxDepth\`, \`false\` otherwise

\`\`\`js
const comments = [
  { text: 'Great post!', replies: [
    { text: 'Thanks!', replies: [
      { text: 'You bet', replies: [] }
    ]},
    { text: 'Agreed', replies: [] }
  ]},
  { text: 'Nice work', replies: [] }
];

flattenComments(comments, 1)
// → [
//   { text: 'Great post!', depth: 0, hasHiddenReplies: false },
//   { text: 'Thanks!',     depth: 1, hasHiddenReplies: true  },
//   { text: 'Agreed',      depth: 1, hasHiddenReplies: false },
//   { text: 'Nice work',   depth: 0, hasHiddenReplies: false }
// ]
\`\`\`

Order is depth-first.

> [!tip]
> Pass \`depth\` down through recursion. A comment at \`depth === maxDepth\` should not recurse into its replies, but you still need to look at \`replies.length\` to set \`hasHiddenReplies\`.`,
  description: 'Flatten a nested comment tree up to a depth limit, with metadata for indented rendering.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  timeLimitMinutes: 30,
  tags: ['array', 'recursion', 'tree'],
  starterCode: {
    javascript: `function flattenComments(comments, maxDepth) {
  const result = [];
  function walk(nodes, depth) {
    // depth-first walk, push entries into result
  }
  walk(comments, 0);
  return result;
}`,
    typescript: `interface Comment {
  text: string;
  replies: Comment[];
}

interface FlatComment {
  text: string;
  depth: number;
  hasHiddenReplies: boolean;
}

function flattenComments(comments: Comment[], maxDepth: number): FlatComment[] {
  const result: FlatComment[] = [];
  function walk(nodes: Comment[], depth: number): void {
    // depth-first walk, push entries into result
  }
  walk(comments, 0);
  return result;
}`,
  },
  publicTestCode: `test('flattens with maxDepth = 2', () => {
  const comments = [
    { text: 'Great post!', replies: [
      { text: 'Thanks!', replies: [
        { text: 'You bet', replies: [] }
      ]},
      { text: 'Agreed', replies: [] }
    ]},
    { text: 'Nice work', replies: [] }
  ];
  expect(flattenComments(comments, 2)).toEqual([
    { text: 'Great post!', depth: 0, hasHiddenReplies: false },
    { text: 'Thanks!',     depth: 1, hasHiddenReplies: false },
    { text: 'You bet',     depth: 2, hasHiddenReplies: false },
    { text: 'Agreed',      depth: 1, hasHiddenReplies: false },
    { text: 'Nice work',   depth: 0, hasHiddenReplies: false }
  ]);
});

test('marks hasHiddenReplies when cut off at maxDepth', () => {
  const comments = [
    { text: 'Great post!', replies: [
      { text: 'Thanks!', replies: [
        { text: 'You bet', replies: [] }
      ]},
      { text: 'Agreed', replies: [] }
    ]}
  ];
  expect(flattenComments(comments, 1)).toEqual([
    { text: 'Great post!', depth: 0, hasHiddenReplies: false },
    { text: 'Thanks!',     depth: 1, hasHiddenReplies: true  },
    { text: 'Agreed',      depth: 1, hasHiddenReplies: false }
  ]);
});`,
  hiddenTestCode: `test('empty input', () => {
  expect(flattenComments([], 3)).toEqual([]);
});

test('maxDepth = 0 shows only top-level', () => {
  const comments = [
    { text: 'a', replies: [{ text: 'a1', replies: [] }] },
    { text: 'b', replies: [] }
  ];
  expect(flattenComments(comments, 0)).toEqual([
    { text: 'a', depth: 0, hasHiddenReplies: true  },
    { text: 'b', depth: 0, hasHiddenReplies: false }
  ]);
});

test('maxDepth larger than tree depth — nothing hidden', () => {
  const comments = [
    { text: '1', replies: [
      { text: '2', replies: [
        { text: '3', replies: [] }
      ]}
    ]}
  ];
  expect(flattenComments(comments, 10)).toEqual([
    { text: '1', depth: 0, hasHiddenReplies: false },
    { text: '2', depth: 1, hasHiddenReplies: false },
    { text: '3', depth: 2, hasHiddenReplies: false }
  ]);
});

test('deeply nested chain truncated', () => {
  const comments = [
    { text: '1', replies: [
      { text: '2', replies: [
        { text: '3', replies: [
          { text: '4', replies: [] }
        ]}
      ]}
    ]}
  ];
  expect(flattenComments(comments, 2)).toEqual([
    { text: '1', depth: 0, hasHiddenReplies: false },
    { text: '2', depth: 1, hasHiddenReplies: false },
    { text: '3', depth: 2, hasHiddenReplies: true  }
  ]);
});

test('mixed branches — some hit limit, some do not', () => {
  const comments = [
    { text: 'r1', replies: [
      { text: 'r1a', replies: [{ text: 'r1a1', replies: [] }] }
    ]},
    { text: 'r2', replies: [] },
    { text: 'r3', replies: [
      { text: 'r3a', replies: [{ text: 'r3a1', replies: [{ text: 'r3a1x', replies: [] }] }] }
    ]}
  ];
  expect(flattenComments(comments, 2)).toEqual([
    { text: 'r1',    depth: 0, hasHiddenReplies: false },
    { text: 'r1a',   depth: 1, hasHiddenReplies: false },
    { text: 'r1a1',  depth: 2, hasHiddenReplies: false },
    { text: 'r2',    depth: 0, hasHiddenReplies: false },
    { text: 'r3',    depth: 0, hasHiddenReplies: false },
    { text: 'r3a',   depth: 1, hasHiddenReplies: false },
    { text: 'r3a1',  depth: 2, hasHiddenReplies: true  }
  ]);
});

test('leaf at maxDepth — no hidden replies flag', () => {
  const comments = [
    { text: 'root', replies: [
      { text: 'leaf', replies: [] }
    ]}
  ];
  expect(flattenComments(comments, 1)).toEqual([
    { text: 'root', depth: 0, hasHiddenReplies: false },
    { text: 'leaf', depth: 1, hasHiddenReplies: false }
  ]);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## Recursive with depth check

Two things travel through recursion: the current \`depth\`, and the decision of whether to descend into \`replies\`.

For each comment:
1. Build the flat entry \`text\`, current \`depth\`, and \`hasHiddenReplies\`.
2. If \`depth < maxDepth\`, recurse into \`replies\` with \`depth + 1\`. Otherwise stop.

## Full Implementation`,
      code: `function flattenComments(comments, maxDepth) {
  function walk(nodes, depth) {
    return nodes.flatMap(c => {
      const truncated = depth === maxDepth && c.replies.length > 0;
      const entry = { text: c.text, depth, hasHiddenReplies: truncated };
      return depth < maxDepth
        ? [entry, ...walk(c.replies, depth + 1)]
        : [entry];
    });
  }
  return walk(comments, 0);
}`,
    },
  ],
};
