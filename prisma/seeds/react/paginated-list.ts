import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

const STARTER_CODE_REACT = `import { useState, useEffect } from 'react';

// Fetch from PokéAPI — https://pokeapi.co/api/v2/pokemon?limit=5&offset=N
// Response: { count, next, previous, results: [{ name, url }] }

function useFetch(url) {
  // Return { data, loading, error }
  // Re-fetch when url changes
  // Cancel stale in-flight requests on cleanup
  return { data: null, loading: false, error: null };
}

const PAGE_SIZE = 5;

export default function App() {
  const [page, setPage] = useState(1);
  const offset = (page - 1) * PAGE_SIZE;
  const { data, loading, error } = useFetch(
    \`https://pokeapi.co/api/v2/pokemon?limit=\${PAGE_SIZE}&offset=\${offset}\`
  );

  // Render: loading state, error state, pokémon list, and prev/next pagination
  // totalPages = Math.ceil(data.count / PAGE_SIZE)
  return <div />;
}`;

const STARTER_CODE_REACT_TS = `import { useState, useEffect } from 'react';

interface Pokemon {
  name: string;
  url: string;
}

interface PokemonResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Pokemon[];
}

interface FetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useFetch<T>(url: string): FetchResult<T> {
  // Return { data, loading, error }
  // Re-fetch when url changes
  // Cancel stale in-flight requests on cleanup
  return { data: null, loading: false, error: null };
}

const PAGE_SIZE = 5;

export default function App(): JSX.Element {
  const [page, setPage] = useState<number>(1);
  const offset = (page - 1) * PAGE_SIZE;
  const { data, loading, error } = useFetch<PokemonResponse>(
    \`https://pokeapi.co/api/v2/pokemon?limit=\${PAGE_SIZE}&offset=\${offset}\`
  );

  // Render: loading state, error state, pokémon list, and prev/next pagination
  // totalPages = Math.ceil(data.count / PAGE_SIZE)
  return <div />;
}`;

const SOLUTION_CODE = `import { useState, useEffect } from 'react';

const PAGE_SIZE = 5;

function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}

export default function App() {
  const [page, setPage] = useState(1);
  const offset = (page - 1) * PAGE_SIZE;
  const { data, loading, error } = useFetch(
    \`https://pokeapi.co/api/v2/pokemon?limit=\${PAGE_SIZE}&offset=\${offset}\`
  );

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 1;

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      {loading && <p data-testid="loading">Loading…</p>}
      {error && <p data-testid="error">{error}</p>}
      {!loading && !error && data && (
        <ul data-testid="list" style={{ listStyle: 'none', padding: 0 }}>
          {data.results.map((pokemon, i) => (
            <li
              key={pokemon.name}
              data-testid={\`list-item-\${i}\`}
              style={{
                marginBottom: 8,
                padding: 12,
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                textTransform: 'capitalize',
              }}
            >
              {pokemon.name}
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
        <button
          data-testid="prev-btn"
          onClick={() => setPage((p) => p - 1)}
          disabled={page === 1}
        >
          Previous
        </button>
        <span data-testid="page-info">Page {page} of {totalPages}</span>
        <button
          data-testid="next-btn"
          onClick={() => setPage((p) => p + 1)}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}`;

const SOLUTION_EXPLANATION = `## useFetch: three concerns in one hook

### The cancelled flag

When the user clicks Next quickly, two fetches may be in-flight simultaneously. Without a guard, the slower response (from the earlier page) can land after the faster one and overwrite the correct data:

\`\`\`js
let cancelled = false;

fetch(url).then((res) => res.json()).then((json) => {
  if (!cancelled) setData(json); // drop stale response
});

return () => { cancelled = true; }; // runs before next effect
\`\`\`

The cleanup function fires before the next \`useEffect\` run, so by the time a new fetch starts, the old one's callback is already deaf.

### Resetting state on URL change

Setting \`data\` and \`error\` back to \`null\` at the top of the effect prevents the previous page's content from flickering while the next page loads. The loading indicator shows immediately.

### AbortController — the real-world upgrade

The cancelled flag stops state updates but doesn't terminate the in-flight network request. In production you'd use \`AbortController\`:

\`\`\`js
const controller = new AbortController();
fetch(url, { signal: controller.signal })
  .then(...)
  .catch((err) => {
    if (err.name === 'AbortError') return; // intentional cancel, not an error
    setError(err.message);
  });
return () => controller.abort();
\`\`\`

This frees the network connection and avoids parsing the response body.

### Pagination: total pages from \`count\`

PokéAPI returns the full collection size in \`count\` (1302+ at time of writing). Compute \`totalPages\` from \`count\` and your page size so the component stays in sync with the API — no hardcoded page count:

\`\`\`js
const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 1;
// prev disabled when page === 1
// next disabled when page === totalPages
\`\`\`

The \`data ? ... : 1\` fallback means buttons render in a safe initial state during the first load.

### Followups

- How would you cache pages so navigating back doesn't re-fetch? (\`Map<url, data>\` in a ref, or a library like SWR/React Query)
- How would you handle the case where the user navigates away mid-fetch? (AbortController + component unmount cleanup)
- How would you add retry-on-error with exponential backoff?

## Full Implementation`;

const PROMPT = `Build a **paginated Pokémon list** by implementing a \`useFetch\` hook, then use it to render results from the [PokéAPI](https://pokeapi.co) with previous/next navigation.

The API supports \`limit\` and \`offset\` query params:

\`\`\`text
GET https://pokeapi.co/api/v2/pokemon?limit=5&offset=0
{
  "count": 1302,
  "next": "https://pokeapi.co/api/v2/pokemon?limit=5&offset=5",
  "previous": null,
  "results": [{ "name": "bulbasaur", "url": "https://..." }, ...]
}
\`\`\`

### Requirements

1. **\`useFetch(url)\`** returns \`{ data, loading, error }\`. Trigger a new fetch whenever \`url\` changes. Use a cleanup flag to cancel stale in-flight requests so a rapid page-change never overwrites newer results.
2. **Loading state** — show \`data-testid="loading"\` while the request is in flight.
3. **Error state** — show \`data-testid="error"\` when fetch rejects or returns a non-OK status.
4. **Pokémon list** — render each pokémon's \`name\` inside \`data-testid="list"\` with \`data-testid="list-item-{i}"\` (zero-indexed).
5. **Pagination** — page size 5. Previous / Next buttons. Previous is disabled on page 1; Next is disabled on the last page. Compute \`totalPages = Math.ceil(count / 5)\`. Show current position in \`data-testid="page-info"\` (e.g. \`Page 2 of 261\`).

### Required \`data-testid\` attributes

- \`data-testid="list"\` — the list container
- \`data-testid="list-item-{i}"\` — each list item, zero-indexed
- \`data-testid="loading"\` — loading indicator (only while fetching)
- \`data-testid="error"\` — error message (only on failure)
- \`data-testid="prev-btn"\` — previous page button
- \`data-testid="next-btn"\` — next page button
- \`data-testid="page-info"\` — page label, e.g. \`Page 1 of 261\`

> [!tip]
> The cleanup function returned from \`useEffect\` fires before the next effect run. Set a \`cancelled\` boolean there — then any \`.then()\` callbacks from the old fetch silently no-op instead of updating state.`;

const PUBLIC_TEST_CODE = `beforeEach(() => {
  globalThis.fetch = (url) => {
    const match = /offset=(\\d+)/.exec(url);
    const offset = match ? parseInt(match[1], 10) : 0;
    const results = Array.from({ length: 5 }, (_, i) => ({
      name: \`pokemon-\${offset + i + 1}\`,
      url: \`https://pokeapi.co/api/v2/pokemon/\${offset + i + 1}/\`,
    }));
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        count: 15,
        next: offset + 5 < 15 ? 'next-url' : null,
        previous: offset > 0 ? 'prev-url' : null,
        results,
      }),
    });
  };
});

test('shows loading state on mount', () => {
  render(<UserComponent />);
  expect(screen.getByTestId('loading')).toBeTruthy();
});

test('renders list of 5 items after fetch resolves', async () => {
  render(<UserComponent />);
  await waitFor(() => {
    expect(screen.getByTestId('list')).toBeTruthy();
    expect(screen.getByTestId('list-item-0')).toBeTruthy();
    expect(screen.getByTestId('list-item-4')).toBeTruthy();
  }, { timeout: 3000 });
});

test('shows page-info as Page 1 of 3', async () => {
  render(<UserComponent />);
  await waitFor(() => {
    expect(screen.getByTestId('page-info').textContent).toMatch(/Page 1 of 3/);
  }, { timeout: 3000 });
});

test('next button advances to page 2', async () => {
  render(<UserComponent />);
  await waitFor(() => screen.getByTestId('list'), { timeout: 3000 });
  fireEvent.click(screen.getByTestId('next-btn'));
  await waitFor(() => {
    expect(screen.getByTestId('page-info').textContent).toMatch(/Page 2 of 3/);
  }, { timeout: 3000 });
});

test('prev button is disabled on page 1', async () => {
  render(<UserComponent />);
  await waitFor(() => screen.getByTestId('prev-btn'), { timeout: 3000 });
  expect(screen.getByTestId('prev-btn').disabled).toBe(true);
});

test('next button is disabled on the last page', async () => {
  render(<UserComponent />);
  await waitFor(() => screen.getByTestId('list'), { timeout: 3000 });
  fireEvent.click(screen.getByTestId('next-btn'));
  await waitFor(() => screen.getByTestId('page-info').textContent.includes('Page 2'), { timeout: 3000 });
  fireEvent.click(screen.getByTestId('next-btn'));
  await waitFor(() => {
    expect(screen.getByTestId('next-btn').disabled).toBe(true);
  }, { timeout: 3000 });
});

test('prev button navigates back to page 1 from page 2', async () => {
  render(<UserComponent />);
  await waitFor(() => screen.getByTestId('list'), { timeout: 3000 });
  fireEvent.click(screen.getByTestId('next-btn'));
  await waitFor(() => screen.getByTestId('page-info').textContent.includes('Page 2'), { timeout: 3000 });
  fireEvent.click(screen.getByTestId('prev-btn'));
  await waitFor(() => {
    expect(screen.getByTestId('page-info').textContent).toMatch(/Page 1 of 3/);
  }, { timeout: 3000 });
});

test('shows error state when fetch rejects', async () => {
  globalThis.fetch = () => Promise.reject(new Error('Network error'));
  render(<UserComponent />);
  await waitFor(() => {
    expect(screen.getByTestId('error')).toBeTruthy();
    expect(screen.queryByTestId('list')).toBeNull();
  }, { timeout: 3000 });
});

test('shows error state when fetch returns non-OK status', async () => {
  globalThis.fetch = () => Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
  render(<UserComponent />);
  await waitFor(() => {
    expect(screen.getByTestId('error')).toBeTruthy();
  }, { timeout: 3000 });
});`;

export const paginatedList: SeedQuestion = {
  slug: 'paginated-list',
  title: 'Paginated List with useFetch',
  prompt: PROMPT,
  description: 'Implement a useFetch(url) hook returning { data, loading, error } with stale-request cancellation, then use it to render a paginated Pokémon list (PokéAPI) with prev/next navigation.',
  type: QuestionType.REACT_APP,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  timeLimitMinutes: 45,
  tags: ['react', 'hooks', 'async', 'fetch', 'pagination'],
  starterCode: {
    react: STARTER_CODE_REACT,
    reactTypescript: STARTER_CODE_REACT_TS,
  },
  publicTestCode: PUBLIC_TEST_CODE,
  solutions: [
    {
      language: 'javascript',
      code: SOLUTION_CODE,
      explanation: SOLUTION_EXPLANATION,
    },
  ],
};
