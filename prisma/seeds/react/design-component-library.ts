import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const designComponentLibrary: SeedQuestion = {
  slug: 'design-component-library',
  title: 'Design System Architecture',
  prompt: 'Design a scalable component library architecture. Explain how you would structure themes, tokens, variants, and composability.',
  description: 'Design a scalable component library with themes, design tokens, variants, and composable primitives.',
  type: QuestionType.REACT_APP,
  difficulty: Difficulty.HARD,
  accessTier: AccessTier.FREE,
  tags: ['system-design', 'react'],
  starterCode: {
    react: '// Outline your component library architecture\nexport default function ThemeProvider({ children }) {\n  return <>{children}</>;\n}',
    reactTypescript: '// Outline your component library architecture\nexport default function ThemeProvider({ children }: { children: React.ReactNode }): JSX.Element {\n  return <>{children}</>;\n}',
  },
  publicTestCode: `test('ThemeProvider renders children', () => {
  render(<ThemeProvider><span>hello</span></ThemeProvider>);
  expect(screen.getByText('hello')).toBeTruthy();
});`,
};
