import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const hollowSquare: SeedQuestion = {
  slug: 'hollow-square',
  title: 'Hollow Square Pattern',
  prompt: `Print a hollow square of \`*\` characters with the given side length \`n\`.

**Rules:**
- The first and last rows are fully filled with \`*\`.
- Middle rows have \`*\` only at the first and last positions, with spaces in between.
- Return the pattern as a single string with rows separated by \`\\n\`.

**Example — \`n = 5\`:**
\`\`\`
*****
*   *
*   *
*   *
*****
\`\`\`

**Example — \`n = 3\`:**
\`\`\`
***
* *
***
\`\`\`

**Hint:** You need a conditional inside the inner loop — print \`*\` if it's the first/last row or first/last column, otherwise a space.`,
  description: 'Print a hollow square pattern using nested loops with conditional branching.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.EASY,
  accessTier: AccessTier.FREE,
  tags: ['loops', 'strings'],
  starterCode: {
    javascript: `function hollowSquare(n) {
  // Return the hollow square pattern as a string
}`,
    typescript: `function hollowSquare(n: number): string {
  // Return the hollow square pattern as a string
}`,
  },
  publicTestCode: `test('5x5 hollow square', () => {
  const expected = [
    '*****',
    '*   *',
    '*   *',
    '*   *',
    '*****',
  ].join('\\n');
  expect(hollowSquare(5)).toBe(expected);
});

test('3x3 hollow square', () => {
  const expected = [
    '***',
    '* *',
    '***',
  ].join('\\n');
  expect(hollowSquare(3)).toBe(expected);
});`,
  hiddenTestCode: `test('1x1 square is a single *', () => {
  expect(hollowSquare(1)).toBe('*');
});

test('2x2 square is fully filled', () => {
  const expected = [
    '**',
    '**',
  ].join('\\n');
  expect(hollowSquare(2)).toBe(expected);
});

test('4x4 hollow square', () => {
  const expected = [
    '****',
    '*  *',
    '*  *',
    '****',
  ].join('\\n');
  expect(hollowSquare(4)).toBe(expected);
});

test('7x7 hollow square', () => {
  const expected = [
    '*******',
    '*     *',
    '*     *',
    '*     *',
    '*     *',
    '*     *',
    '*******',
  ].join('\\n');
  expect(hollowSquare(7)).toBe(expected);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## Nested loops with boundary check

The outer loop iterates rows, the inner loop iterates columns. A cell gets \`*\` if it sits on any edge (first/last row or first/last column), otherwise it gets a space.

\`\`\`
row === 0          → top edge
row === n - 1      → bottom edge
col === 0          → left edge
col === n - 1      → right edge
\`\`\`

This is the classic pattern for testing whether a candidate understands conditionals inside nested loops.`,
      code: `function hollowSquare(n) {
  const rows = [];
  for (let r = 0; r < n; r++) {
    let row = '';
    for (let c = 0; c < n; c++) {
      if (r === 0 || r === n - 1 || c === 0 || c === n - 1) {
        row += '*';
      } else {
        row += ' ';
      }
    }
    rows.push(row);
  }
  return rows.join('\\n');
}`,
    },
  ],
};
