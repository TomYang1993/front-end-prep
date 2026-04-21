import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const cssGridLayout: SeedQuestion = {
  slug: 'css-grid-layout',
  title: 'Responsive Dashboard Grid',
  prompt: 'Create a responsive dashboard layout using CSS Grid that adapts from 1 to 3 columns based on viewport width.',
  description: 'Create a responsive CSS Grid dashboard layout that adapts from 1 to 3 columns based on viewport width.',
  type: QuestionType.REACT_APP,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['css', 'react'],
  starterCode: {
    react: 'export default function Dashboard() {\n  return <div className="dashboard-grid">{/* widgets */}</div>;\n}',
    reactTypescript: 'export default function Dashboard(): JSX.Element {\n  return <div className="dashboard-grid">{/* widgets */}</div>;\n}',
  },
  publicTestCode: `test('renders dashboard with grid layout', () => {
  render(<Dashboard />);
  const grid = document.querySelector('.dashboard-grid');
  expect(grid).toBeTruthy();
});`,
};
