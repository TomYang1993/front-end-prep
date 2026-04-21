import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const rateLimiterButton: SeedQuestion = {
  slug: 'rate-limiter-button',
  title: 'Rate Limiter Button',
  prompt: 'Build a React component with a button that limits how often it can be clicked. Implement a simple rate limiter that disables the button after N clicks within a time window, re-enabling it once the window resets. Display the remaining clicks and cooldown timer.',
  description: 'Build a button with a rate limiter that caps clicks per time window and shows a cooldown timer.',
  type: QuestionType.REACT_APP,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['react', 'hooks'],
  starterCode: {
    react: 'export default function RateLimiterButton() {\n  return <button>Click me</button>;\n}',
    reactTypescript: 'export default function RateLimiterButton(): JSX.Element {\n  return <button>Click me</button>;\n}',
  },
  publicTestCode: `test('renders a clickable button', () => {
  render(<RateLimiterButton />);
  expect(screen.getByRole('button')).toBeTruthy();
});

test('disables after max clicks', () => {
  render(<RateLimiterButton />);
  const button = screen.getByRole('button');
  for (let i = 0; i < 5; i++) fireEvent.click(button);
  expect(button.disabled).toBe(true);
});`,
};
