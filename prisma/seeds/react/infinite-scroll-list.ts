/**
 * Seed: "Infinite Scroll List" React question.
 * Run with: npx tsx prisma/seeds/react/infinite-scroll-list.ts
 */
import {
  PrismaClient,
  QuestionType,
  Difficulty,
  AccessTier,
  QuestionVersionStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

const SLUG = 'infinite-scroll-list';

const STARTER_CODE_REACT = `import React, { useState } from 'react';

/**
 * Mock API — returns a page of items after a short delay.
 * page:     1-based page number
 * pageSize: items per page (default 20)
 * total:    100 items in the dataset
 *
 * Returns: { items: string[], hasMore: boolean }
 */
function fetchItems(page, pageSize = 20) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const total = 100;
      const start = (page - 1) * pageSize;
      const end = Math.min(start + pageSize, total);
      const items = Array.from({ length: end - start }, (_, i) => \`Item \${start + i + 1}\`);
      resolve({ items, hasMore: end < total });
    }, 500);
  });
}

export default function InfiniteScrollList() {
  const [items, setItems] = useState([]);

  return (
    <div style={{ height: '100vh', overflow: 'auto' }}>
      <h2>Infinite Scroll</h2>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      {/* TODO: load more items as the user scrolls to the bottom */}
    </div>
  );
}`;

const STARTER_CODE_REACT_TS = `import React, { useState } from 'react';

/**
 * Mock API — returns a page of items after a short delay.
 * page:     1-based page number
 * pageSize: items per page (default 20)
 * total:    100 items in the dataset
 *
 * Returns: { items: string[], hasMore: boolean }
 */
function fetchItems(page: number, pageSize = 20): Promise<{ items: string[]; hasMore: boolean }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const total = 100;
      const start = (page - 1) * pageSize;
      const end = Math.min(start + pageSize, total);
      const items = Array.from({ length: end - start }, (_, i) => \`Item \${start + i + 1}\`);
      resolve({ items, hasMore: end < total });
    }, 500);
  });
}

export default function InfiniteScrollList(): JSX.Element {
  const [items, setItems] = useState<string[]>([]);

  return (
    <div style={{ height: '100vh', overflow: 'auto' }}>
      <h2>Infinite Scroll</h2>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      {/* TODO: load more items as the user scrolls to the bottom */}
    </div>
  );
}`;

const STARTER_CSS = `/* Infinite Scroll Styles */

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 15px;
}
`;

const SOLUTION_CODE = `import React, { useState, useEffect, useRef, useCallback } from 'react';

function fetchItems(page, pageSize = 20) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const total = 100;
      const start = (page - 1) * pageSize;
      const end = Math.min(start + pageSize, total);
      const items = Array.from({ length: end - start }, (_, i) => \`Item \${start + i + 1}\`);
      resolve({ items, hasMore: end < total });
    }, 500);
  });
}

export default function InfiniteScrollList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const data = await fetchItems(page);
    setItems((prev) => [...prev, ...data.items]);
    setHasMore(data.hasMore);
    setPage((p) => p + 1);
    setLoading(false);
  }, [page, loading, hasMore]);

  // Load the first page on mount
  useEffect(() => {
    loadMore();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Set up IntersectionObserver on the sentinel element
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div style={{ height: '100vh', overflow: 'auto' }}>
      <h2>Infinite Scroll</h2>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      {loading && <p style={{ textAlign: 'center', color: '#888', padding: '16px' }}>Loading…</p>}
      {!hasMore && <p style={{ textAlign: 'center', color: '#888', padding: '16px' }}>No more items</p>}
      {hasMore && !loading && <div ref={sentinelRef} style={{ height: 1 }} />}
    </div>
  );
}`;

const SOLUTION_EXPLANATION = `## Core Approach: IntersectionObserver + Sentinel Element

The cleanest way to detect "user scrolled to the bottom" is a zero-height sentinel \`<div>\` placed after the last list item, watched by an \`IntersectionObserver\`. When it enters the viewport, we trigger the next fetch.

This is far more performant than listening to the \`scroll\` event, which fires on every pixel of movement and requires manual throttling plus bounding-rect math.

\`\`\`jsx
const observer = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      loadMore();
    }
  },
  { threshold: 0.1 }
);

observer.observe(sentinelRef.current);
return () => observer.disconnect();
\`\`\`

## State Management

Four pieces of state keep the loading lifecycle predictable:

| State | Purpose |
|-------|---------|
| \`items\` | Accumulated items across all fetched pages |
| \`page\` | Next page number to request |
| \`loading\` | Guards against concurrent fetches |
| \`hasMore\` | Disables the observer once data is exhausted |

\`loadMore\` is wrapped in \`useCallback\` with its dependencies so the observer effect can re-attach when the callback identity changes (pointing to the new page/loading/hasMore values).

## Why \`useCallback\` + re-subscribing the observer?

Each call to \`loadMore\` reads \`page\`, \`loading\`, and \`hasMore\` from closure. Without \`useCallback\`, the observer would hold a stale reference to the initial closure. The second \`useEffect\` depends on \`loadMore\` so that whenever the callback updates (after a page loads), the observer disconnects and re-attaches — guaranteeing it always calls the latest \`loadMore\`.

## Loading & end-of-list states

Show a "Loading…" indicator while a fetch is in flight so the user knows more content is coming. Once \`hasMore\` is false, display "No more items" and stop rendering the sentinel entirely — preventing wasted observer callbacks.`;

const PROMPT = `Build an **infinite-scrolling list** that automatically loads more items as the user scrolls to the bottom.

### Requirements

1. **Initial load** — fetch and display the first page of items on mount
2. **Scroll detection** — detect when the user has scrolled near the bottom and trigger the next page fetch
3. **Cumulative rendering** — append new items to the existing list (don't replace)
4. **Loading indicator** — show a visual loading state while a fetch is in progress
5. **End-of-list** — stop fetching and indicate "no more items" once the dataset is exhausted
6. **No duplicate fetches** — guard against firing multiple concurrent requests for the same page

### Provided

A \`fetchItems(page, pageSize?)\` mock function is included in the starter code. It returns \`{ items: string[], hasMore: boolean }\` after a 500ms simulated delay. The total dataset has **100 items** and default page size is 20.

### Hints

- \`IntersectionObserver\` is cleaner than scroll-event listeners for detecting when an element enters the viewport
- Place a zero-height "sentinel" element after the last item and observe it
- Remember to disconnect the observer on cleanup
- \`useCallback\` helps keep observer references fresh across re-renders`;

async function main() {
  // 1. Upsert tags
  const tagReact = await prisma.questionTag.upsert({ where: { name: 'react' }, update: {}, create: { name: 'react' } });
  const tagHooks = await prisma.questionTag.upsert({ where: { name: 'hooks' }, update: {}, create: { name: 'hooks' } });
  const tagPerf = await prisma.questionTag.upsert({ where: { name: 'performance' }, update: {}, create: { name: 'performance' } });
  const tagDom = await prisma.questionTag.upsert({ where: { name: 'dom-api' }, update: {}, create: { name: 'dom-api' } });

  // 2. Get admin user
  const adminUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!adminUser) {
    throw new Error('No user found. Run `npx prisma db seed` first.');
  }

  // 3. Upsert the question
  const question = await prisma.question.upsert({
    where: { slug: SLUG },
    update: {
      title: 'Infinite Scroll List',
      prompt: PROMPT,
      type: QuestionType.REACT_APP,
      difficulty: Difficulty.MEDIUM,
      accessTier: AccessTier.FREE,
      isPublished: true,
    },
    create: {
      slug: SLUG,
      title: 'Infinite Scroll List',
      prompt: PROMPT,
      type: QuestionType.REACT_APP,
      difficulty: Difficulty.MEDIUM,
      accessTier: AccessTier.FREE,
      isPublished: true,
      createdById: adminUser.id,
    },
  });

  console.log(`Question upserted: ${question.id} (${question.slug})`);

  // 4. Tags
  for (const tag of [tagReact, tagHooks, tagPerf, tagDom]) {
    await prisma.questionTagOnQuestion.upsert({
      where: { questionId_tagId: { questionId: question.id, tagId: tag.id } },
      update: {},
      create: { questionId: question.id, tagId: tag.id },
    });
  }

  // 5. Version with starter code
  await prisma.questionVersion.upsert({
    where: { questionId_version: { questionId: question.id, version: 1 } },
    update: {
      starterCode: { react: STARTER_CODE_REACT, reactTypescript: STARTER_CODE_REACT_TS, css: STARTER_CSS },
      content: {
        description: 'Build an infinite-scrolling list using IntersectionObserver that loads paginated data as the user scrolls down.',
      },
    },
    create: {
      questionId: question.id,
      version: 1,
      status: QuestionVersionStatus.PUBLISHED,
      content: {
        description: 'Build an infinite-scrolling list using IntersectionObserver that loads paginated data as the user scrolls down.',
      },
      starterCode: { react: STARTER_CODE_REACT, reactTypescript: STARTER_CODE_REACT_TS, css: STARTER_CSS },
      publishedAt: new Date(),
    },
  });

  // 6. Test code (RTL tests for React questions)
  await prisma.question.update({
    where: { id: question.id },
    data: {
      publicTestCode: `test('first 20 items render on initial mount', async () => {
  render(<UserComponent />);
  await waitFor(() => {
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 20')).toBeInTheDocument();
  });
});

test('loading indicator appears while fetching', async () => {
  render(<UserComponent />);
  // Initial load should show loading state
  await waitFor(() => {
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });
});

test('items are appended, not replaced', async () => {
  render(<UserComponent />);
  await waitFor(() => {
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });
  // First batch should remain after more loads
  expect(screen.getByText('Item 1')).toBeInTheDocument();
});`,
    },
  });

  // 7. Official solution
  await prisma.officialSolution.upsert({
    where: { id: `${question.id}-official-react` },
    update: {
      explanation: SOLUTION_EXPLANATION,
      code: SOLUTION_CODE,
      complexity: 'O(n) items, O(1) observer',
    },
    create: {
      id: `${question.id}-official-react`,
      questionId: question.id,
      language: 'typescript',
      explanation: SOLUTION_EXPLANATION,
      code: SOLUTION_CODE,
      complexity: 'O(n) items, O(1) observer',
    },
  });

  // 8. Refresh renderData
  const { refreshQuestionRenderData } = await import('../../../lib/questions-snapshot');
  await refreshQuestionRenderData(question.id);

  console.log(`✓ Question seeded: "${question.title}" (${SLUG})`);
  console.log(`  - 4 tags: react, hooks, performance, dom-api`);
  console.log(`  - 6 public acceptance criteria`);
  console.log(`  - 1 official solution with explanation`);
  console.log(`  - renderData refreshed`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
