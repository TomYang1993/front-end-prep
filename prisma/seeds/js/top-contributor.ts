import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const topContributor: SeedQuestion = {
  slug: 'top-contributor',
  title: 'Find the Top Contributor',
  prompt: `Given an array of commit logs, find the author with the most commits. Return their name.

\`\`\`js
const commits = [
  { author: 'alice', message: 'fix bug' },
  { author: 'bob', message: 'add feature' },
  { author: 'alice', message: 'refactor' },
  { author: 'alice', message: 'docs' },
  { author: 'bob', message: 'test' }
];

topContributor(commits)
// \u2192 'alice'
\`\`\`

If there's a tie, return whichever tied author appears first in the commits array.

**Why this matters:** "Who's the top X?" is a universal analytics question — group by, count, find max.`,
  description: 'Find the most frequent author in commit logs using reduce and aggregation.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['array', 'reduce'],
  starterCode: {
    javascript: `function topContributor(commits) {
  // Return the author name with the most commits
}`,
    typescript: `interface Commit {
  author: string;
  message: string;
}

function topContributor(commits: Commit[]): string {
  // Return the author name with the most commits
}`,
  },
  publicTestCode: `test('finds the most frequent author', () => {
  const commits = [
    { author: 'alice', message: 'fix bug' },
    { author: 'bob', message: 'add feature' },
    { author: 'alice', message: 'refactor' },
    { author: 'alice', message: 'docs' },
    { author: 'bob', message: 'test' }
  ];
  expect(topContributor(commits)).toBe('alice');
});

test('single author', () => {
  const commits = [
    { author: 'carol', message: 'init' },
    { author: 'carol', message: 'update' }
  ];
  expect(topContributor(commits)).toBe('carol');
});`,
  hiddenTestCode: `test('single commit', () => {
  expect(topContributor([{ author: 'dave', message: 'first' }])).toBe('dave');
});

test('tie returns first author seen', () => {
  const commits = [
    { author: 'alice', message: 'a' },
    { author: 'bob', message: 'b' }
  ];
  expect(topContributor(commits)).toBe('alice');
});

test('three-way tie returns first', () => {
  const commits = [
    { author: 'x', message: '1' },
    { author: 'y', message: '2' },
    { author: 'z', message: '3' }
  ];
  expect(topContributor(commits)).toBe('x');
});

test('later author overtakes', () => {
  const commits = [
    { author: 'alice', message: 'a1' },
    { author: 'bob', message: 'b1' },
    { author: 'bob', message: 'b2' },
    { author: 'bob', message: 'b3' }
  ];
  expect(topContributor(commits)).toBe('bob');
});

test('many authors', () => {
  const commits = [
    { author: 'a', message: '1' },
    { author: 'b', message: '2' },
    { author: 'c', message: '3' },
    { author: 'b', message: '4' },
    { author: 'c', message: '5' },
    { author: 'c', message: '6' }
  ];
  expect(topContributor(commits)).toBe('c');
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## Two-pass approach: count then find max

**Pass 1 — Count:** Use \`reduce\` to build a frequency map \`{ alice: 3, bob: 2 }\`.

**Pass 2 — Find max:** Use \`Object.entries\` + \`reduce\` to find the entry with the highest count. On ties, the first-seen author wins because \`>\` (strict greater) keeps the current leader.

This is the JS equivalent of \`GROUP BY author ORDER BY COUNT(*) DESC LIMIT 1\`.`,
      code: `function topContributor(commits) {
  const counts = commits.reduce((acc, c) => {
    acc[c.author] = (acc[c.author] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).reduce((top, entry) =>
    entry[1] > top[1] ? entry : top
  )[0];
}`,
    },
  ],
};
