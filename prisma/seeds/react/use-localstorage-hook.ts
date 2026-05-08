import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const useLocalStorageHook: SeedQuestion = {
  slug: 'use-localstorage-hook',
  title: 'useLocalStorage Hook',
  prompt: `Implement a custom React hook \`useLocalStorage\` that mirrors the \`useState\` API but persists the value to \`localStorage\`, then wire it into a demo component.

\`\`\`js
const [value, setValue] = useLocalStorage(key, initialValue);
\`\`\`

### Hook behavior

1. **Lazy init.** On mount, read the key from \`localStorage\`. If present, parse it as JSON and use it. Otherwise fall back to \`initialValue\`. Read happens **once** — do not re-read on every render.
2. **\`useState\`-compatible setter.** \`setValue\` accepts either a new value *or* an updater function \`(prev) => next\`, just like \`useState\`.
3. **Write through.** Whenever the value changes, JSON-serialize and write it to \`localStorage\` under \`key\`.
4. **Resilience.** If JSON parsing fails (corrupt data), fall back to \`initialValue\` instead of crashing.

### Demo component

Your \`App\` should render two persisted pieces of state:

- A text input bound to a \`name\` value (initial: empty string)
- A counter that starts at \`0\`, with **Increment** and **Reset** buttons

Required \`data-testid\` attributes:

- \`data-testid="name-input"\` — the text input
- \`data-testid="name-display"\` — element showing the current \`name\`
- \`data-testid="counter"\` — element showing the current count
- \`data-testid="increment"\` — increment button
- \`data-testid="reset"\` — resets the counter to \`0\`

**Hint:** \`useState\` accepts a function for lazy initialization — perfect spot to read \`localStorage\`. Use \`useEffect\` to sync writes.`,
  description: 'Implement a useLocalStorage hook with a useState-compatible API that persists state across reloads, then use it in a counter + name demo.',
  type: QuestionType.REACT_APP,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['react', 'hooks', 'storage'],
  starterCode: {
    react: `import { useState } from 'react';

function useLocalStorage(key, initialValue) {
  // Implement this hook
  return [initialValue, () => {}];
}

export default function App() {
  const [name, setName] = useLocalStorage('demo:name', '');
  const [count, setCount] = useLocalStorage('demo:count', 0);

  return (
    <div>
      <input
        data-testid="name-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <p>Hello, <span data-testid="name-display">{name}</span></p>
      <p>Count: <span data-testid="counter">{count}</span></p>
      <button data-testid="increment" onClick={() => setCount(c => c + 1)}>Increment</button>
      <button data-testid="reset" onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}`,
    reactTypescript: `import { useState, Dispatch, SetStateAction } from 'react';

function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  // Implement this hook
  return [initialValue, () => {}];
}

export default function App(): JSX.Element {
  const [name, setName] = useLocalStorage<string>('demo:name', '');
  const [count, setCount] = useLocalStorage<number>('demo:count', 0);

  return (
    <div>
      <input
        data-testid="name-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <p>Hello, <span data-testid="name-display">{name}</span></p>
      <p>Count: <span data-testid="counter">{count}</span></p>
      <button data-testid="increment" onClick={() => setCount(c => c + 1)}>Increment</button>
      <button data-testid="reset" onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}`,
  },
  publicTestCode: `beforeEach(() => {
  localStorage.clear();
});

test('uses initial value when localStorage is empty', () => {
  render(<App />);
  expect(screen.getByTestId('counter').textContent).toBe('0');
  expect(screen.getByTestId('name-display').textContent).toBe('');
});

test('typing into the input updates the display', async () => {
  render(<App />);
  fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Ada' } });
  await waitFor(() => {
    expect(screen.getByTestId('name-display').textContent).toBe('Ada');
  });
});

test('writes to localStorage when count changes', async () => {
  render(<App />);
  fireEvent.click(screen.getByTestId('increment'));
  await waitFor(() => {
    expect(JSON.parse(localStorage.getItem('demo:count'))).toBe(1);
  });
});`,
  hiddenTestCode: `beforeEach(() => {
  localStorage.clear();
});

test('reads existing value from localStorage on mount', () => {
  localStorage.setItem('demo:count', JSON.stringify(42));
  localStorage.setItem('demo:name', JSON.stringify('Linus'));
  render(<App />);
  expect(screen.getByTestId('counter').textContent).toBe('42');
  expect(screen.getByTestId('name-display').textContent).toBe('Linus');
});

test('functional updater form works (setCount(c => c + 1))', async () => {
  render(<App />);
  fireEvent.click(screen.getByTestId('increment'));
  fireEvent.click(screen.getByTestId('increment'));
  fireEvent.click(screen.getByTestId('increment'));
  await waitFor(() => {
    expect(screen.getByTestId('counter').textContent).toBe('3');
    expect(JSON.parse(localStorage.getItem('demo:count'))).toBe(3);
  });
});

test('reset writes 0 to localStorage', async () => {
  render(<App />);
  fireEvent.click(screen.getByTestId('increment'));
  fireEvent.click(screen.getByTestId('increment'));
  fireEvent.click(screen.getByTestId('reset'));
  await waitFor(() => {
    expect(screen.getByTestId('counter').textContent).toBe('0');
    expect(JSON.parse(localStorage.getItem('demo:count'))).toBe(0);
  });
});

test('falls back to initialValue when stored JSON is corrupt', () => {
  localStorage.setItem('demo:count', '{not valid json');
  render(<App />);
  expect(screen.getByTestId('counter').textContent).toBe('0');
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## Lazy init + write-through pattern

The hook is essentially \`useState\` wrapped with a read on mount and a write on change.

1. **Lazy init via \`useState(fn)\`.** Pass an initializer function so the \`localStorage\` read happens only on the first render — not every render. Wrap it in try/catch so a corrupt stored value falls back to \`initialValue\` instead of crashing.
2. **Write on change via \`useEffect\`.** Serialize and write whenever \`value\` (or \`key\`) changes. Putting the write in an effect — not in the setter — keeps the setter signature identical to \`useState\`'s, so functional updates \`setValue(prev => ...)\` work for free.
3. **Return \`[value, setValue]\`** directly — \`setValue\` is just \`useState\`'s setter, which already supports both value-form and updater-form.

### Things to watch out for in real production code

- **SSR safety.** \`localStorage\` is undefined on the server. In a Next.js / SSR app you'd guard with \`typeof window !== 'undefined'\` and read in a \`useEffect\` instead — accepting one render of \`initialValue\` to avoid hydration mismatch.
- **Cross-tab sync.** Subscribe to the \`storage\` event so other tabs setting the same key update this tab's state.
- **Key changes.** If \`key\` changes, you'd want to re-read — usually keys are static, but be intentional.`,
      code: `import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota exceeded or storage disabled — silently ignore
    }
  }, [key, value]);

  return [value, setValue];
}

export default function App() {
  const [name, setName] = useLocalStorage('demo:name', '');
  const [count, setCount] = useLocalStorage('demo:count', 0);

  return (
    <div>
      <input
        data-testid="name-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <p>Hello, <span data-testid="name-display">{name}</span></p>
      <p>Count: <span data-testid="counter">{count}</span></p>
      <button data-testid="increment" onClick={() => setCount(c => c + 1)}>Increment</button>
      <button data-testid="reset" onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}`,
    },
  ],
};
