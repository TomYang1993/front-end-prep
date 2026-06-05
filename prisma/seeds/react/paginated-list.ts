import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

const STARTER_CODE_REACT = `import { useState, useEffect } from 'react';

// Mock server — already wired up. Call fetch('/api/posts?page=N') like a real network request.
// Response: { items: [{ id, title, body }], total: 15, page: N, totalPages: 3 }
const POSTS = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  title: \`Post \${i + 1}\`,
  body: \`This is the body of post \${i + 1}.\`,
}));
window.fetch = (url) => {
  const params = new URL(url, location.origin).searchParams;
  const page = parseInt(params.get('page') || '1', 10);
  const items = POSTS.slice((page - 1) * 5, page * 5);
  return new Promise((resolve) =>
    setTimeout(
      () => resolve({ ok: true, json: () => Promise.resolve({ items, total: 15, page, totalPages: 3 }) }),
      200,
    ),
  );
};

function useFetch(url) {
  // Return { data, loading, error }
  // Re-fetch when url changes
  // Cancel stale in-flight requests on cleanup
  return { data: null, loading: false, error: null };
}

export default function App() {
  const [page, setPage] = useState(1);
  const { data, loading, error } = useFetch(\`/api/posts?page=\${page}\`);

  // Render: loading state, error state, post list, and prev/next pagination
  return <div />;
}`;

const STARTER_CODE_REACT_TS = `import { useState, useEffect } from 'react';

interface Post {
  id: number;
  title: string;
  body: string;
}

interface PostsResponse {
  items: Post[];
  total: number;
  page: number;
  totalPages: number;
}

interface FetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Mock server — already wired up. Call fetch('/api/posts?page=N') like a real network request.
// Response: { items: [{ id, title, body }], total: 15, page: N, totalPages: 3 }
const POSTS: Post[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  title: \`Post \${i + 1}\`,
  body: \`This is the body of post \${i + 1}.\`,
}));
(window as any).fetch = (url: string) => {
  const params = new URL(url, location.origin).searchParams;
  const page = parseInt(params.get('page') || '1', 10);
  const items = POSTS.slice((page - 1) * 5, page * 5);
  return new Promise((resolve) =>
    setTimeout(
      () => resolve({ ok: true, json: () => Promise.resolve({ items, total: 15, page, totalPages: 3 }) }),
      200,
    ),
  );
};

function useFetch<T>(url: string): FetchResult<T> {
  // Return { data, loading, error }
  // Re-fetch when url changes
  // Cancel stale in-flight requests on cleanup
  return { data: null, loading: false, error: null };
}

export default function App(): JSX.Element {
  const [page, setPage] = useState<number>(1);
  const { data, loading, error } = useFetch<PostsResponse>(\`/api/posts?page=\${page}\`);

  // Render: loading state, error state, post list, and prev/next pagination
  return <div />;
}`;

const SOLUTION_CODE = `import { useState, useEffect } from 'react';

const POSTS = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  title: \`Post \${i + 1}\`,
  body: \`This is the body of post \${i + 1}.\`,
}));
window.fetch = (url) => {
  const params = new URL(url, location.origin).searchParams;
  const page = parseInt(params.get('page') || '1', 10);
  const items = POSTS.slice((page - 1) * 5, page * 5);
  return new Promise((resolve) =>
    setTimeout(
      () => resolve({ ok: true, json: () => Promise.resolve({ items, total: 15, page, totalPages: 3 }) }),
      200,
    ),
  );
};

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
  const { data, loading, error } = useFetch(\`/api/posts?page=\${page}\`);

  const totalPages = data?.totalPages ?? 1;

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      {loading && <p data-testid="loading">Loading…</p>}
      {error && <p data-testid="error">{error}</p>}
      {!loading && !error && data && (
        <ul data-testid="list" style={{ listStyle: 'none', padding: 0 }}>
          {data.items.map((post, i) => (
            <li
              key={post.id}
              data-testid={\`list-item-\${i}\`}
              style={{ marginBottom: 16, padding: 12, border: '1px solid #e5e7eb', borderRadius: 6 }}
            >
              <strong>{post.title}</strong>
              <p style={{ margin: '4px 0 0', color: '#6b7280' }}>{post.body}</p>
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

### Pagination: disabled state from response data

Deriving button state from the API's \`totalPages\` field keeps the component in sync with the server — no hardcoded page count. The \`?? 1\` fallback means buttons render in a safe initial state during the first load.

\`\`\`js
const totalPages = data?.totalPages ?? 1;
// prev disabled when page === 1
// next disabled when page === totalPages
\`\`\`

### Followups

- How would you cache pages so navigating back doesn't re-fetch? (\`Map<url, data>\` in a ref, or a library like SWR/React Query)
- How would you handle the case where the user navigates away mid-fetch? (AbortController + component unmount cleanup)
- How would you add retry-on-error with exponential backoff?

## Full Implementation`;

const PROMPT = `Build a **paginated post list** by implementing a \`useFetch\` hook, then use it to display posts with previous/next navigation.

The mock server is already wired up — call \`fetch('/api/posts?page=N')\` like any real network request:

\`\`\`text
GET /api/posts?page=1
{ "items": [{ "id": 1, "title": "Post 1", "body": "..." }, ...], "total": 15, "page": 1, "totalPages": 3 }
\`\`\`

### Requirements

1. **\`useFetch(url)\`** returns \`{ data, loading, error }\`. Trigger a new fetch whenever \`url\` changes. Use a cleanup flag to cancel stale in-flight requests so a rapid page-change never overwrites newer results.
2. **Loading state** — show \`data-testid="loading"\` while the request is in flight.
3. **Error state** — show \`data-testid="error"\` when fetch rejects or returns a non-OK status.
4. **Post list** — render each item inside \`data-testid="list"\` with \`data-testid="list-item-{i}"\` (zero-indexed).
5. **Pagination** — Previous / Next buttons. Previous is disabled on page 1; Next is disabled on the last page. Show current position in \`data-testid="page-info"\` (e.g. \`Page 2 of 3\`).

### Required \`data-testid\` attributes

- \`data-testid="list"\` — the list container
- \`data-testid="list-item-{i}"\` — each list item, zero-indexed
- \`data-testid="loading"\` — loading indicator (only while fetching)
- \`data-testid="error"\` — error message (only on failure)
- \`data-testid="prev-btn"\` — previous page button
- \`data-testid="next-btn"\` — next page button
- \`data-testid="page-info"\` — page label, e.g. \`Page 1 of 3\`

> [!tip]
> The cleanup function returned from \`useEffect\` fires before the next effect run. Set a \`cancelled\` boolean there — then any \`.then()\` callbacks from the old fetch silently no-op instead of updating state.`;

const PUBLIC_TEST_CODE = `const POSTS = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  title: \`Post \${i + 1}\`,
  body: \`Body \${i + 1}\`,
}));

beforeEach(() => {
  global.fetch = (url) => {
    const page = parseInt(new URL(url, 'http://x').searchParams.get('page') || '1', 10);
    const items = POSTS.slice((page - 1) * 5, page * 5);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ items, total: 15, page, totalPages: 3 }),
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
});`;

const HIDDEN_TEST_CODE = `const POSTS = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  title: \`Post \${i + 1}\`,
  body: \`Body \${i + 1}\`,
}));

beforeEach(() => {
  global.fetch = (url) => {
    const page = parseInt(new URL(url, 'http://x').searchParams.get('page') || '1', 10);
    const items = POSTS.slice((page - 1) * 5, page * 5);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ items, total: 15, page, totalPages: 3 }),
    });
  };
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
  global.fetch = () => Promise.reject(new Error('Network error'));
  render(<UserComponent />);
  await waitFor(() => {
    expect(screen.getByTestId('error')).toBeTruthy();
    expect(screen.queryByTestId('list')).toBeNull();
  }, { timeout: 3000 });
});

test('shows error state when fetch returns non-OK status', async () => {
  global.fetch = () => Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
  render(<UserComponent />);
  await waitFor(() => {
    expect(screen.getByTestId('error')).toBeTruthy();
  }, { timeout: 3000 });
});`;

export const paginatedList: SeedQuestion = {
  slug: 'paginated-list',
  title: 'Paginated List with useFetch',
  prompt: PROMPT,
  description: 'Implement a useFetch(url) hook returning { data, loading, error } with stale-request cancellation, then use it to render a paginated post list with prev/next navigation.',
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
  hiddenTestCode: HIDDEN_TEST_CODE,
  solutions: [
    {
      language: 'javascript',
      code: SOLUTION_CODE,
      explanation: SOLUTION_EXPLANATION,
    },
  ],
};
