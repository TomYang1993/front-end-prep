import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const useLocalStorageHook: SeedQuestion = {
  slug: 'use-localstorage-hook',
  title: 'useLocalStorage Hook with Cross-Tab Auth',
  prompt: `Implement a custom React hook \`useLocalStorage\` that mirrors the \`useState\` API, persists to \`localStorage\`, and **stays in sync across browser tabs**. Then wire it into a permissioned-auth demo.

\`\`\`js
const [user, setUser] = useLocalStorage('auth:user', null);
\`\`\`

### Hook behavior

1. **Lazy init.** On mount, read the key from \`localStorage\`. If present, parse as JSON and use it. Otherwise fall back to \`initialValue\`. The read must happen **once** — not on every render.
2. **\`useState\`-compatible setter.** \`setValue\` accepts either a new value or an updater \`(prev) => next\`.
3. **Write through.** Whenever the value changes, JSON-serialize and write it to \`localStorage\` under \`key\`.
4. **Cross-tab sync.** Subscribe to the window \`storage\` event. When *another* tab writes to the same \`key\`, this tab updates its state too. Clean up the listener on unmount.
5. **Resilience.** If parsing fails (corrupt data or bad event payload), fall back to current state instead of crashing.

### Demo component

Build a tiny auth UI in \`App\` using \`useLocalStorage('auth:user', null)\`. The stored user shape:

\`\`\`ts
type User = { name: string; permissions: string[] } | null;
\`\`\`

**Logged-out view** (when \`user === null\`):
- Text input for name
- Three checkboxes for permissions: \`read\`, \`write\`, \`delete\`
- A **Log in** button that stores \`{ name, permissions: [...checked] }\`

**Logged-in view** (when \`user\` is set):
- A greeting showing the user's name
- An **Admin Panel** section, but **only** if the user has *all* of \`['write', 'delete']\`
- A **Log out** button that clears the stored user back to \`null\`

Required \`data-testid\` attributes:

- \`data-testid="name-input"\` — name field (logged-out view)
- \`data-testid="perm-read"\`, \`"perm-write"\`, \`"perm-delete"\` — permission checkboxes
- \`data-testid="login-btn"\` — log-in button
- \`data-testid="greeting"\` — element shown only when logged in (e.g. \`Hello, Ada\`)
- \`data-testid="admin-panel"\` — present **only** if user has both \`write\` and \`delete\`
- \`data-testid="logout-btn"\` — log-out button

**Hints:**
- \`useState\` accepts a function for lazy init — perfect for the \`localStorage\` read.
- Use \`useEffect\` to wire up \`window.addEventListener('storage', …)\` and \`removeEventListener\` on cleanup.
- For the admin gate: \`required.every(p => user.permissions.includes(p))\`.`,
  description: 'Implement a useLocalStorage hook with useState-compatible API, cross-tab sync via the storage event, and a permissioned auth demo gated by every+includes.',
  type: QuestionType.REACT_APP,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  timeLimitMinutes: 45,
  tags: ['react', 'hooks', 'storage', 'auth'],
  starterCode: {
    react: `import { useState } from 'react';

function useLocalStorage(key, initialValue) {
  // 1. Lazy init from localStorage (try/catch for corrupt JSON)
  // 2. Write through on change
  // 3. Subscribe to 'storage' event for cross-tab sync; clean up on unmount
  return [initialValue, () => {}];
}

export default function App() {
  const [user, setUser] = useLocalStorage('auth:user', null);

  // Implement logged-out form (name input + 3 perm checkboxes + login button)
  // and logged-in view (greeting + gated admin panel + logout button).
  return <div />;
}`,
    reactTypescript: `import { useState, Dispatch, SetStateAction } from 'react';

type User = { name: string; permissions: string[] } | null;

function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  // 1. Lazy init from localStorage (try/catch for corrupt JSON)
  // 2. Write through on change
  // 3. Subscribe to 'storage' event for cross-tab sync; clean up on unmount
  return [initialValue, () => {}];
}

export default function App(): JSX.Element {
  const [user, setUser] = useLocalStorage<User>('auth:user', null);

  // Implement logged-out form (name input + 3 perm checkboxes + login button)
  // and logged-in view (greeting + gated admin panel + logout button).
  return <div />;
}`,
  },
  publicTestCode: `beforeEach(() => {
  localStorage.clear();
});

test('logged-out view renders form, no greeting or admin panel', () => {
  render(<App />);
  expect(screen.getByTestId('name-input')).toBeTruthy();
  expect(screen.getByTestId('login-btn')).toBeTruthy();
  expect(screen.queryByTestId('greeting')).toBeNull();
  expect(screen.queryByTestId('admin-panel')).toBeNull();
});

test('login persists user to localStorage and shows greeting', async () => {
  render(<App />);
  fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Ada' } });
  fireEvent.click(screen.getByTestId('perm-read'));
  fireEvent.click(screen.getByTestId('login-btn'));
  await waitFor(() => {
    expect(screen.getByTestId('greeting').textContent).toMatch(/Ada/);
    const stored = JSON.parse(localStorage.getItem('auth:user'));
    expect(stored).toEqual({ name: 'Ada', permissions: ['read'] });
  });
});

test('logout clears the stored user', async () => {
  localStorage.setItem('auth:user', JSON.stringify({ name: 'Ada', permissions: ['read'] }));
  render(<App />);
  fireEvent.click(screen.getByTestId('logout-btn'));
  await waitFor(() => {
    expect(screen.queryByTestId('greeting')).toBeNull();
    expect(JSON.parse(localStorage.getItem('auth:user'))).toBeNull();
  });
});`,
  hiddenTestCode: `beforeEach(() => {
  localStorage.clear();
});

test('reads existing user from localStorage on mount', () => {
  localStorage.setItem('auth:user', JSON.stringify({ name: 'Linus', permissions: ['read'] }));
  render(<App />);
  expect(screen.getByTestId('greeting').textContent).toMatch(/Linus/);
});

test('admin panel only shows when user has both write and delete', () => {
  localStorage.setItem('auth:user', JSON.stringify({ name: 'Ada', permissions: ['read', 'write'] }));
  const { rerender, unmount } = render(<App />);
  expect(screen.queryByTestId('admin-panel')).toBeNull();
  unmount();

  localStorage.setItem('auth:user', JSON.stringify({ name: 'Ada', permissions: ['write', 'delete'] }));
  render(<App />);
  expect(screen.getByTestId('admin-panel')).toBeTruthy();
});

test('cross-tab: storage event for the same key updates this tab', async () => {
  render(<App />);
  expect(screen.queryByTestId('greeting')).toBeNull();

  // Simulate another tab writing the user
  const next = { name: 'Grace', permissions: ['read', 'write', 'delete'] };
  localStorage.setItem('auth:user', JSON.stringify(next));
  fireEvent(window, new StorageEvent('storage', {
    key: 'auth:user',
    newValue: JSON.stringify(next),
  }));

  await waitFor(() => {
    expect(screen.getByTestId('greeting').textContent).toMatch(/Grace/);
    expect(screen.getByTestId('admin-panel')).toBeTruthy();
  });
});

test('cross-tab: storage events for unrelated keys are ignored', async () => {
  localStorage.setItem('auth:user', JSON.stringify({ name: 'Ada', permissions: ['read'] }));
  render(<App />);

  fireEvent(window, new StorageEvent('storage', {
    key: 'something-else',
    newValue: 'whatever',
  }));

  // Greeting should still reflect Ada, not crash or change
  expect(screen.getByTestId('greeting').textContent).toMatch(/Ada/);
});

test('falls back gracefully when stored JSON is corrupt', () => {
  localStorage.setItem('auth:user', '{not valid json');
  render(<App />);
  expect(screen.queryByTestId('greeting')).toBeNull();
  expect(screen.getByTestId('name-input')).toBeTruthy();
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## Three concerns, three primitives

The hook stitches together three independent pieces:

1. **Lazy init via \`useState(fn)\`** — the initializer runs once. Wrap the read in try/catch so corrupt JSON falls back to \`initialValue\` instead of crashing the app on load.
2. **Write-through via \`useEffect\`** — serialize and write whenever \`value\` (or \`key\`) changes. Keeping the write in an effect — not in the setter — preserves the \`useState\` setter signature, so functional updates \`setValue(prev => …)\` keep working.
3. **Cross-tab sync via the \`storage\` event** — the browser fires \`storage\` on **other** tabs (not the writer) when \`localStorage\` changes. Subscribe in a \`useEffect\`, filter by \`e.key === key\`, parse \`e.newValue\`, and call \`setValue\`. Don't forget to \`removeEventListener\` in the cleanup.

### The permissions gate

For "user has all required permissions," the canonical pattern is \`filter\` / \`every\` / \`includes\`:

\`\`\`js
const isAdmin = user && ['write', 'delete'].every(p => user.permissions.includes(p));
\`\`\`

Reads almost like English. O(required × user-perms), fine for auth-sized lists.

### Things to watch out for in real production code

- **SSR safety.** \`localStorage\` is undefined on the server. In Next.js you'd guard with \`typeof window !== 'undefined'\` and read in a \`useEffect\` instead — accept one render of \`initialValue\` to avoid hydration mismatch.
- **Storage events don't fire in the writing tab.** That's why we need write-through *and* the listener — the listener handles other tabs, the effect handles this tab. They don't overlap.
- **Quota / private mode.** \`setItem\` can throw (Safari private mode, quota exceeded). Wrap in try/catch.
- **Testing limitation.** jsdom shares one \`localStorage\` across all renders in a file and doesn't auto-fire \`storage\` events the way a real browser does. The hidden test simulates the event with \`fireEvent(window, new StorageEvent(...))\` — that exercises the listener but doesn't prove real cross-tab behavior. For end-to-end confidence, use a Playwright test with two browser contexts.`,
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
      // Quota / private mode — silently ignore
    }
  }, [key, value]);

  useEffect(() => {
    function onStorage(e) {
      if (e.key !== key) return;
      try {
        setValue(e.newValue !== null ? JSON.parse(e.newValue) : initialValue);
      } catch {
        // Bad event payload — ignore
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, initialValue]);

  return [value, setValue];
}

const ALL_PERMS = ['read', 'write', 'delete'];
const ADMIN_PERMS = ['write', 'delete'];

export default function App() {
  const [user, setUser] = useLocalStorage('auth:user', null);
  const [name, setName] = useState('');
  const [perms, setPerms] = useState([]);

  function togglePerm(p) {
    setPerms((prev) => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  function login() {
    setUser({ name, permissions: perms });
  }

  function logout() {
    setUser(null);
    setName('');
    setPerms([]);
  }

  if (user) {
    const isAdmin = ADMIN_PERMS.every(p => user.permissions.includes(p));
    return (
      <div>
        <p data-testid="greeting">Hello, {user.name}</p>
        {isAdmin && <section data-testid="admin-panel">Admin Panel</section>}
        <button data-testid="logout-btn" onClick={logout}>Log out</button>
      </div>
    );
  }

  return (
    <div>
      <input
        data-testid="name-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      {ALL_PERMS.map((p) => (
        <label key={p}>
          <input
            type="checkbox"
            data-testid={\`perm-\${p}\`}
            checked={perms.includes(p)}
            onChange={() => togglePerm(p)}
          />
          {p}
        </label>
      ))}
      <button data-testid="login-btn" onClick={login}>Log in</button>
    </div>
  );
}`,
    },
  ],
};
