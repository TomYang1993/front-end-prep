import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const virtualList: SeedQuestion = {
  slug: 'virtual-list',
  title: 'Virtual List Implementation',
  prompt: 'Build a virtualized list component that efficiently renders only the visible items in a large dataset. Support dynamic row heights.',
  description: 'Build a virtualized list that renders only visible items from a large dataset with dynamic row heights.',
  type: QuestionType.REACT_APP,
  difficulty: Difficulty.HARD,
  accessTier: AccessTier.FREE,
  tags: ['react', 'performance'],
  starterCode: {
    react: 'export default function VirtualList({ items }) {\n  return <div>{/* render visible items */}</div>;\n}',
    reactTypescript: 'type Item = { id: number; text: string };\n\nexport default function VirtualList({ items }: { items: Item[] }): JSX.Element {\n  return <div>{/* render visible items */}</div>;\n}',
  },
  publicTestCode: `test('renders only visible items', () => {
  const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, text: 'Item ' + i }));
  render(<VirtualList items={items} />);
  const rendered = screen.getAllByText(/^Item /);
  expect(rendered.length).toBeLessThan(50);
});`,
};
