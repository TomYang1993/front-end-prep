import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const letterPyramid: SeedQuestion = {
  slug: 'letter-pyramid',
  title: 'Letter Pyramid',
  prompt: `Build a pyramid of letters with \`n\` rows.

Each row \`i\` (0-indexed) contains letters ascending from \`A\` to the \`i\`-th letter, then descending back to \`A\`, centered with leading spaces.

**Example — \`n = 4\`:**
\`\`\`
   A
  ABA
 ABCBA
ABCDCBA
\`\`\`

**Example — \`n = 3\`:**
\`\`\`
  A
 ABA
ABCBA
\`\`\`

**Rules:**
- Use \`String.fromCharCode(65 + offset)\` to generate letters (\`65\` is the char code for \`A\`).
- Each row is padded with leading spaces so the pyramid is right-aligned to the last row.
- Return the pattern as a single string with rows separated by \`\\n\`.
- No trailing spaces on any row.`,
  description: 'Build a centered letter pyramid using nested loops and String.fromCharCode.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.EASY,
  accessTier: AccessTier.FREE,
  tags: ['loops', 'strings'],
  starterCode: {
    javascript: `function letterPyramid(n) {
  // Return the letter pyramid as a string
}`,
    typescript: `function letterPyramid(n: number): string {
  // Return the letter pyramid as a string
}`,
  },
  publicTestCode: `test('4-row pyramid', () => {
  const expected = [
    '   A',
    '  ABA',
    ' ABCBA',
    'ABCDCBA',
  ].join('\\n');
  expect(letterPyramid(4)).toBe(expected);
});

test('3-row pyramid', () => {
  const expected = [
    '  A',
    ' ABA',
    'ABCBA',
  ].join('\\n');
  expect(letterPyramid(3)).toBe(expected);
});`,
  hiddenTestCode: `test('1-row pyramid is just A', () => {
  expect(letterPyramid(1)).toBe('A');
});

test('2-row pyramid', () => {
  const expected = [
    ' A',
    'ABA',
  ].join('\\n');
  expect(letterPyramid(2)).toBe(expected);
});

test('5-row pyramid', () => {
  const expected = [
    '    A',
    '   ABA',
    '  ABCBA',
    ' ABCDCBA',
    'ABCDEDCBA',
  ].join('\\n');
  expect(letterPyramid(5)).toBe(expected);
});

test('6-row pyramid reaches F', () => {
  const expected = [
    '     A',
    '    ABA',
    '   ABCBA',
    '  ABCDCBA',
    ' ABCDEDCBA',
    'ABCDEFEDCBA',
  ].join('\\n');
  expect(letterPyramid(6)).toBe(expected);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## Building each row

For row \`i\` (0-indexed):
1. **Leading spaces:** \`n - 1 - i\` spaces to center the pyramid.
2. **Ascending letters:** \`A\` through \`String.fromCharCode(65 + i)\`.
3. **Descending letters:** back from the second-to-last letter down to \`A\`.

\`String.fromCharCode(65)\` gives \`'A'\`, \`66\` gives \`'B'\`, etc. This tests whether the candidate knows ASCII basics in JS and can manage nested loops with ascending/descending logic.`,
      code: `function letterPyramid(n) {
  const rows = [];
  for (let i = 0; i < n; i++) {
    let row = ' '.repeat(n - 1 - i);
    for (let j = 0; j <= i; j++) {
      row += String.fromCharCode(65 + j);
    }
    for (let j = i - 1; j >= 0; j--) {
      row += String.fromCharCode(65 + j);
    }
    rows.push(row);
  }
  return rows.join('\\n');
}`,
    },
  ],
};
