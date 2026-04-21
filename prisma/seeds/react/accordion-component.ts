import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const accordionComponent: SeedQuestion = {
  slug: 'accordion-component',
  title: 'Accordion Component',
  prompt: 'Build an accessible accordion component that expands and collapses sections. Handle keyboard navigation and ARIA attributes.',
  description: 'Build an accessible expand/collapse accordion with keyboard nav and ARIA support.',
  type: QuestionType.REACT_APP,
  difficulty: Difficulty.EASY,
  accessTier: AccessTier.FREE,
  tags: ['react', 'a11y'],
  starterCode: {
    react: 'export default function Accordion() {\n  return <div>Accordion</div>;\n}',
    reactTypescript: 'export default function Accordion(): JSX.Element {\n  return <div>Accordion</div>;\n}',
  },
  publicTestCode: `test('renders section headers', () => {
  render(<Accordion />);
  expect(screen.getByRole('button', { name: /section/i })).toBeTruthy();
});

test('toggles content on click', () => {
  render(<Accordion />);
  const button = screen.getByRole('button', { name: /section/i });
  fireEvent.click(button);
  expect(screen.getByText(/content/i)).toBeTruthy();
});`,
};
