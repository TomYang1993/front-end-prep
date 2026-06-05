import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

const STARTER_CODE_REACT = `import React, { useState } from 'react';

const FRUITS = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape'];

// Mock async fetch — pretend this hits a network.
export const mockFetch = (query) =>
  new Promise((resolve) =>
    setTimeout(
      () => resolve(FRUITS.filter((f) => f.toLowerCase().includes(query.toLowerCase()))),
      200,
    ),
  );

export default function AutocompleteSearch() {
  const [query, setQuery] = useState('');

  return (
    <div style={{ maxWidth: 320, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <input
        type="text"
        placeholder="Search fruits..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: '100%', padding: 8, fontSize: 14 }}
      />
      {/* TODO: render suggestion list, handle keyboard, debounce, click-outside */}
    </div>
  );
}`;

const STARTER_CODE_REACT_TS = `import React, { useState } from 'react';

const FRUITS = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape'];

// Mock async fetch — pretend this hits a network.
export const mockFetch = (query: string): Promise<string[]> =>
  new Promise((resolve) =>
    setTimeout(
      () => resolve(FRUITS.filter((f) => f.toLowerCase().includes(query.toLowerCase()))),
      200,
    ),
  );

export default function AutocompleteSearch(): JSX.Element {
  const [query, setQuery] = useState<string>('');

  return (
    <div style={{ maxWidth: 320, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <input
        type="text"
        placeholder="Search fruits..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: '100%', padding: 8, fontSize: 14 }}
      />
      {/* TODO: render suggestion list, handle keyboard, debounce, click-outside */}
    </div>
  );
}`;

const SOLUTION_CODE = `import React, { useState, useEffect, useRef } from 'react';

const FRUITS = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape'];
const DEBOUNCE_MS = 300;

export const mockFetch = (query) =>
  new Promise((resolve) =>
    setTimeout(
      () => resolve(FRUITS.filter((f) => f.toLowerCase().includes(query.toLowerCase()))),
      200,
    ),
  );


export default function AutocompleteSearch() {

  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1);

  const requestIdRef = useRef(0);
    const containerRef = useRef(null);


  useEffect(() => {

    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true)
    const uuid = ++requestIdRef.current;
    const timer = setTimeout(() => {
      mockFetch(query).then((data) => {
        // Ignore responses from older requests.
        if (uuid !== requestIdRef.current) return;
        setResults(data);
        setLoading(false);
        setActiveIndex(-1);
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer)

  }, [query])

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);



  const select = (value) => {
    setQuery(value);
    setOpen(false);
    setActiveIndex(-1);
  }

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      select(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showList = open && query.length > 0;
  const showEmpty = showList && !loading && results.length === 0;


  return <div ref={containerRef} style={{ maxWidth: 320, margin: '40px auto', position: 'relative' }}>
    <input
      data-testid="search-input"
      type="text"
      placeholder="Search..."
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        setOpen(true);
      }}
      onKeyDown={handleKeyDown}
      role="combobox"
      style={{ width: '100%', padding: 8, fontSize: 14, boxSizing: 'border-box' }}
    />
    {showList && (
      <ul
        data-testid="suggestion-list"
        role="listbox"
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          margin: 0,
          padding: 0,
          listStyle: 'none',
          border: '1px solid #d1d5db',
          borderRadius: 6,
          background: '#fff',
          maxHeight: 240,
          overflowY: 'auto',
        }}>
        {loading && <li data-testid="loading" style={{ padding: 8, color: '#6b7280' }}>
          Loading…
        </li>}
        {showEmpty && <li data-testid="empty" style={{ padding: 8, color: '#6b7280' }}>
          No Matches
        </li>}
        {!loading && results.map((item, index) => (
          <li
            key={item}
            role="option"
            aria-selected={index === activeIndex}
            onMouseDown={(e) => {
              // prevent propogating up to input onBlur
              e.preventDefault();
              select(item);
            }}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(-1)}
            data-testid={\`suggestion-\${index}\`}
            style={{
              padding: 8,
              cursor: 'pointer',
              background: index === activeIndex ? '#4f48b0ff' : 'transparent',
            }}
          >
            {item}
          </li>))}
      </ul>
    )}
  </div>
}`;

const SOLUTION_EXPLANATION = `## Debounced fetch with a stale-response guard

\`useEffect\` that fires \`mockFetch(query)\` on every keystroke creates two problems: too many requests, and **out-of-order responses**. If the user types \`"ap"\` then quickly types \`"app"\`, the slower \`"ap"\` response can land after \`"app"\` and overwrite the correct results (setTimeout is not strictly accurate on the timing). The problem persists if we use debounce. So we could use a unique ID to identify the latest request.

The fix uses an incrementing request id (acting as a unique ID) stored in a ref:

\`\`\`js
const myId = ++requestIdRef.current;
mockFetch(query).then((data) => {
  if (myId !== requestIdRef.current) return; // stale — discard
  setResults(data);
});
\`\`\`

Plus the standard debounce via \`setTimeout\` and the effect's cleanup, cleanup function runs before next effect:

\`\`\`js
const timer = setTimeout(() => { /* fetch */ }, DEBOUNCE_MS);
return () => clearTimeout(timer);
\`\`\`

## Keyboard navigation

% trick to roll over the whole list

\`\`\`js
if (e.key === 'ArrowDown') setActiveIndex((i) => (i + 1) % results.length);
if (e.key === 'ArrowUp')   setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
if (e.key === 'Enter' && activeIndex >= 0) select(results[activeIndex]);
\`\`\`

Each \`<li>\` gets \`aria-selected\` based on \`activeIndex\` and the container is wired with \`role="combobox" / "listbox" / "option"\` so screen readers track the active descendant.

## mousedown vs click for selection

Clicking a suggestion fires \`mousedown\` on the \`<li>\` **before** the input loses focus. If we listened for \`click\`, the input's \`blur\` ( when you click the searched suggested results, input elment loses focus and onBlur) could fire first and tear down the list before the click registers. Using \`onMouseDown\` with \`preventDefault\` keeps the input focused and the selection lands cleanly.

## Click-outside dismissal

A document-level \`mousedown\` listener checks if the click landed outside the container ref and closes the list if so. The listener only mounts while the list is open, so we're not leaking handlers when the dropdown is closed. This is a naive implementation, mature libraries might use **Dual-Pointer Tracking Pattern** on \`mousedown\` and \`mouseup\` events .

\`\`\`js
useEffect(() => {
  if (!open) return;
  const onDown = (e) => {
    if (!containerRef.current.contains(e.target)) setOpen(false);
  };
  document.addEventListener('mousedown', onDown);
  return () => document.removeEventListener('mousedown', onDown);
}, [open]);
\`\`\`

## Empty + loading states

The dropdown renders one of three states inside the list:

- \`loading\` → "Loading…"
- \`!loading && results.length === 0\` → "No matches"
- otherwise → the suggestion items

## Followups

- How would you cancel the in-flight \`fetch\` itself? (\`AbortController\`)
- How would you cache results so backspacing doesn't re-fetch? (\`Map<query, results>\` in a ref)
- Accessibility

## Full Implementation`;

const PROMPT = `Build an **autocomplete search input** that fetches suggestions as the user types and supports full keyboard control.

A mock async fetch is already provided — treat it as a network call:

\`\`\`js
const mockFetch = (query) =>
  new Promise((resolve) =>
    setTimeout(
      () => resolve(FRUITS.filter((f) => f.toLowerCase().includes(query.toLowerCase()))),
      200,
    ),
  );
\`\`\`

### Requirements

1. Show results in a list under the input
2. Arrow Down / Up move around the list and have focus. Enter selects the highlighted item, Escape closes the list.
3. Clicking a suggestion fills the input and closes the list.
4. Clicking anywhere outside the component closes the list.
5. Show Loading state inside the dropdown while a fetch is pending.
6. Show corresponding state if there is no result.
7. Debounce to make the search experience smooth

### Behavior Details

Required \`data-testid\` attributes for testing:

- \`data-testid="search-input"\` — the text input
- \`data-testid="suggestion-list"\` — the dropdown container (only present while open)
- \`data-testid="suggestion-{i}"\` — each suggestion \`<li>\`, zero-indexed
- \`data-testid="loading"\` — loading indicator
- \`data-testid="empty"\` — "no matches" indicator

The dropdown should not render when the query is empty.`;

export const autocompleteSearch: SeedQuestion = {
  slug: 'autocomplete-search',
  title: 'Autocomplete Search',
  prompt: PROMPT,
  description: 'Build an autocomplete search input that fetches suggestions as the user types and supports full keyboard control.',
  type: QuestionType.REACT_APP,
  difficulty: Difficulty.HARD,
  accessTier: AccessTier.FREE,
  timeLimitMinutes: 60,
  tags: ['react', 'a11y', 'performance', 'async', 'hooks'],
  starterCode: {
    react: STARTER_CODE_REACT,
    reactTypescript: STARTER_CODE_REACT_TS,
  },
  publicTestCode: `test('renders the search input', () => {
  render(<UserComponent />);
  expect(screen.getByTestId('search-input')).toBeTruthy();
});

test('no dropdown when query is empty', () => {
  render(<UserComponent />);
  fireEvent.focus(screen.getByTestId('search-input'));
  expect(screen.queryByTestId('suggestion-list')).toBeNull();
});

test('shows suggestions after typing', async () => {
  render(<UserComponent />);
  const input = screen.getByTestId('search-input');
  fireEvent.change(input, { target: { value: 'a' } });
  await waitFor(() => {
    expect(screen.getByTestId('suggestion-list')).toBeTruthy();
    expect(screen.getByTestId('suggestion-0')).toBeTruthy();
  }, { timeout: 3000 });
});

test('clicking a suggestion fills the input and closes the list', async () => {
  render(<UserComponent />);
  const input = screen.getByTestId('search-input');
  fireEvent.change(input, { target: { value: 'a' } });
  await waitFor(() => screen.getByTestId('suggestion-0'), { timeout: 3000 });
  fireEvent.mouseDown(screen.getByTestId('suggestion-0'));
  expect(input.value.length).toBeGreaterThan(0);
  expect(screen.queryByTestId('suggestion-list')).toBeNull();
});

test('Arrow Down + Enter selects highlighted suggestion', async () => {
  render(<UserComponent />);
  const input = screen.getByTestId('search-input');
  fireEvent.change(input, { target: { value: 'a' } });
  await waitFor(() => screen.getByTestId('suggestion-0'), { timeout: 3000 });

  fireEvent.keyDown(input, { key: 'ArrowDown' });
  fireEvent.keyDown(input, { key: 'Enter' });

  expect(input.value.length).toBeGreaterThan(0);
  expect(screen.queryByTestId('suggestion-list')).toBeNull();
});

test('Escape closes the dropdown', async () => {
  render(<UserComponent />);
  const input = screen.getByTestId('search-input');
  fireEvent.change(input, { target: { value: 'a' } });
  await waitFor(() => screen.getByTestId('suggestion-list'), { timeout: 3000 });
  fireEvent.keyDown(input, { key: 'Escape' });
  expect(screen.queryByTestId('suggestion-list')).toBeNull();
});

test('empty state when no results match', async () => {
  render(<UserComponent />);
  const input = screen.getByTestId('search-input');
  fireEvent.change(input, { target: { value: 'zzzzzz' } });
  await waitFor(() => {
    expect(screen.getByTestId('empty')).toBeTruthy();
  }, { timeout: 3000 });
});

test('click outside closes the dropdown', async () => {
  render(
    <div>
      <UserComponent />
      <button data-testid="outside">outside</button>
    </div>,
  );
  const input = screen.getByTestId('search-input');
  fireEvent.change(input, { target: { value: 'a' } });
  await waitFor(() => screen.getByTestId('suggestion-list'), { timeout: 3000 });
  fireEvent.mouseDown(screen.getByTestId('outside'));
  expect(screen.queryByTestId('suggestion-list')).toBeNull();
});`,
  solutions: [
    {
      language: 'javascript',
      code: SOLUTION_CODE,
      explanation: SOLUTION_EXPLANATION,
    },
  ],
};
