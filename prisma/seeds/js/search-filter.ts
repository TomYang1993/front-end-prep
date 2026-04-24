import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const searchFilter: SeedQuestion = {
  slug: 'search-filter',
  title: 'Build a Search Filter',
  prompt: `Given a list of articles and a search query, return articles where the query appears in either the \`title\` or any \`tag\`. The search should be **case-insensitive**.

\`\`\`js
const articles = [
  { title: 'Intro to React', tags: ['frontend', 'javascript'] },
  { title: 'Python Basics', tags: ['backend', 'python'] },
  { title: 'React Hooks Deep Dive', tags: ['react', 'advanced'] }
];

searchArticles(articles, 'react')
// \u2192 [
//   { title: 'Intro to React', tags: ['frontend', 'javascript'] },
//   { title: 'React Hooks Deep Dive', tags: ['react', 'advanced'] }
// ]
\`\`\`

The first article matches because "React" is in the title. The third matches on both title and tag.

**Why this matters:** Client-side search/filter is in every app with a list view.`,
  description: 'Filter articles by case-insensitive search across title and tags.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.EASY,
  accessTier: AccessTier.FREE,
  tags: ['array', 'filter'],
  starterCode: {
    javascript: `function searchArticles(articles, query) {
  // Return articles matching the query in title or any tag
}`,
    typescript: `interface Article {
  title: string;
  tags: string[];
}

function searchArticles(articles: Article[], query: string): Article[] {
  // Return articles matching the query in title or any tag
}`,
  },
  publicTestCode: `test('finds articles by title or tag', () => {
  const articles = [
    { title: 'Intro to React', tags: ['frontend', 'javascript'] },
    { title: 'Python Basics', tags: ['backend', 'python'] },
    { title: 'React Hooks Deep Dive', tags: ['react', 'advanced'] }
  ];
  const result = searchArticles(articles, 'react');
  expect(result).toEqual([
    { title: 'Intro to React', tags: ['frontend', 'javascript'] },
    { title: 'React Hooks Deep Dive', tags: ['react', 'advanced'] }
  ]);
});

test('case-insensitive match', () => {
  const articles = [
    { title: 'CSS Grid Guide', tags: ['css'] }
  ];
  expect(searchArticles(articles, 'CSS')).toEqual(articles);
  expect(searchArticles(articles, 'css')).toEqual(articles);
});`,
  hiddenTestCode: `test('matches on tag only', () => {
  const articles = [
    { title: 'Getting Started', tags: ['python', 'beginner'] },
    { title: 'Advanced Topics', tags: ['java', 'expert'] }
  ];
  expect(searchArticles(articles, 'python')).toEqual([
    { title: 'Getting Started', tags: ['python', 'beginner'] }
  ]);
});

test('no matches returns empty array', () => {
  const articles = [
    { title: 'Intro to React', tags: ['frontend'] }
  ];
  expect(searchArticles(articles, 'rust')).toEqual([]);
});

test('empty query returns all articles', () => {
  const articles = [
    { title: 'A', tags: ['x'] },
    { title: 'B', tags: ['y'] }
  ];
  expect(searchArticles(articles, '')).toEqual(articles);
});

test('empty articles returns empty array', () => {
  expect(searchArticles([], 'test')).toEqual([]);
});

test('partial match in title', () => {
  const articles = [
    { title: 'JavaScript Fundamentals', tags: ['web'] }
  ];
  expect(searchArticles(articles, 'script')).toEqual(articles);
});

test('partial match in tag', () => {
  const articles = [
    { title: 'Guide', tags: ['frontend'] }
  ];
  expect(searchArticles(articles, 'front')).toEqual(articles);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## filter + includes + some

Convert the query to lowercase once, then filter articles where:
- The lowercased title includes the query, **OR**
- Some tag (lowercased) includes the query

\`\`\`js
a.title.toLowerCase().includes(q) ||
a.tags.some(tag => tag.toLowerCase().includes(q))
\`\`\`

The \`some\` short-circuits — it stops checking tags as soon as one matches. This is the standard pattern for multi-field search in client-side filtering.`,
      code: `function searchArticles(articles, query) {
  const q = query.toLowerCase();
  return articles.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.tags.some(tag => tag.toLowerCase().includes(q))
  );
}`,
    },
  ],
};
