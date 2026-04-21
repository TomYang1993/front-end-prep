import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const usePreviousHook: SeedQuestion = {
  slug: 'use-previous-hook',
  title: 'usePrevious Hook',
  prompt: `Implement a custom React hook \`usePrevious\` that returns the previous value of a given state or prop, then wire it into a demo component.

Your \`App\` component should:

1. Render a **numeric counter** (starting at 0) with **Increment** and **Decrement** buttons
2. Display the **current** count and the **previous** count (from \`usePrevious\`)
3. Use the exact \`data-testid\` attributes so the tests can find your elements:
   - \`data-testid="count"\` — the current count
   - \`data-testid="previous"\` — the previous count (empty or \`"undefined"\` on first render)
   - \`data-testid="increment"\` — the increment button
   - \`data-testid="decrement"\` — the decrement button

### usePrevious behaviour

- On the **first render**, return \`undefined\` (there is no previous value yet).
- After each re-render, return the value from the **previous** render cycle.

**Hint:** \`useRef\` persists across renders without triggering a re-render, and \`useEffect\` runs *after* render.`,
  description: 'Create a custom React hook that tracks and returns the previous value, wired into a counter demo.',
  type: QuestionType.REACT_APP,
  difficulty: Difficulty.EASY,
  accessTier: AccessTier.FREE,
  tags: ['react', 'hooks'],
  starterCode: {
    react: `import { useState } from 'react';

function usePrevious(value) {
  // Implement this hook
  return undefined;
}

export default function App() {
  const [count, setCount] = useState(0);
  const previous = usePrevious(count);

  return (
    <div>
      <p>Current: <span data-testid="count">{count}</span></p>
      <p>Previous: <span data-testid="previous">{String(previous)}</span></p>
      <button data-testid="increment" onClick={() => setCount(c => c + 1)}>Increment</button>
      <button data-testid="decrement" onClick={() => setCount(c => c - 1)}>Decrement</button>
    </div>
  );
}`,
    reactTypescript: `import { useState } from 'react';

function usePrevious<T>(value: T): T | undefined {
  // Implement this hook
  return undefined;
}

export default function App(): JSX.Element {
  const [count, setCount] = useState(0);
  const previous = usePrevious(count);

  return (
    <div>
      <p>Current: <span data-testid="count">{count}</span></p>
      <p>Previous: <span data-testid="previous">{String(previous)}</span></p>
      <button data-testid="increment" onClick={() => setCount(c => c + 1)}>Increment</button>
      <button data-testid="decrement" onClick={() => setCount(c => c - 1)}>Decrement</button>
    </div>
  );
}`,
  },
  publicTestCode: `test('shows undefined as previous on first render', () => {
  render(<App />);
  expect(screen.getByTestId('previous').textContent).toBe('undefined');
});

test('shows current count starting at 0', () => {
  render(<App />);
  expect(screen.getByTestId('count').textContent).toBe('0');
});

test('after one increment, previous is 0 and count is 1', async () => {
  render(<App />);
  fireEvent.click(screen.getByTestId('increment'));
  await waitFor(() => {
    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.getByTestId('previous').textContent).toBe('0');
  });
});`,
  hiddenTestCode: `test('after two increments, previous is 1 and count is 2', async () => {
  render(<App />);
  fireEvent.click(screen.getByTestId('increment'));
  fireEvent.click(screen.getByTestId('increment'));
  await waitFor(() => {
    expect(screen.getByTestId('count').textContent).toBe('2');
    expect(screen.getByTestId('previous').textContent).toBe('1');
  });
});

test('decrement updates previous correctly', async () => {
  render(<App />);
  fireEvent.click(screen.getByTestId('increment'));
  fireEvent.click(screen.getByTestId('decrement'));
  await waitFor(() => {
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('previous').textContent).toBe('1');
  });
});

test('multiple transitions track previous accurately', async () => {
  render(<App />);
  fireEvent.click(screen.getByTestId('increment'));
  fireEvent.click(screen.getByTestId('increment'));
  fireEvent.click(screen.getByTestId('increment'));
  fireEvent.click(screen.getByTestId('decrement'));
  await waitFor(() => {
    expect(screen.getByTestId('count').textContent).toBe('2');
    expect(screen.getByTestId('previous').textContent).toBe('3');
  });
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## useRef + useEffect pattern

The key insight: \`useRef\` holds a mutable value that persists across renders without causing re-renders, and \`useEffect\` runs *after* the render is committed to the DOM.

1. On each render, the hook returns \`ref.current\` (still the old value)
2. After render, \`useEffect\` fires and updates \`ref.current\` to the new value
3. Next render, \`ref.current\` now holds what was "current" last time — i.e. the previous value

This is the standard React pattern for tracking previous values.`,
      code: `import { useState, useRef, useEffect } from 'react';

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export default function App() {
  const [count, setCount] = useState(0);
  const previous = usePrevious(count);

  return (
    <div>
      <p>Current: <span data-testid="count">{count}</span></p>
      <p>Previous: <span data-testid="previous">{String(previous)}</span></p>
      <button data-testid="increment" onClick={() => setCount(c => c + 1)}>Increment</button>
      <button data-testid="decrement" onClick={() => setCount(c => c - 1)}>Decrement</button>
    </div>
  );
}`,
    },
  ],
};
