import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const webCrawler: SeedQuestion = {
  slug: 'web-crawler',
  title: 'Web Crawler',
  prompt: `Implement a web crawler that discovers all pages reachable from a starting URL within the same domain.

You are given:
- \`pages\` — a dictionary mapping URLs to lists of links found on that page
- \`start_url\` — the URL to begin crawling from

### Rules

1. **BFS traversal** — visit pages in breadth-first order
2. **Same-domain filter** — only follow links with the same protocol + host as \`start_url\` (e.g. if start is \`https://example.com/home\`, follow \`https://example.com/about\` but skip \`https://other.com\`)
3. **Resolve relative paths** — treat \`"/about"\` as \`"{origin}/about"\`
4. **Skip missing pages** — if a URL is not a key in \`pages\`, treat it as a 404 and skip it
5. **No duplicate visits** — never crawl the same URL twice

Return a **sorted list** of all successfully visited URLs.

### Example

\`\`\`python
pages = {
    "https://a.com": ["/about", "https://a.com/blog"],
    "https://a.com/about": ["https://b.com"],
    "https://a.com/blog": ["/about"],
}
web_crawl(pages, "https://a.com")
# → ["https://a.com", "https://a.com/about", "https://a.com/blog"]
\`\`\`

\`https://b.com\` is filtered out (different domain). \`"/about"\` resolves to \`"https://a.com/about"\`. The cycle between \`/blog\` and \`/about\` is handled by the visited set.`,
  description: 'Implement a BFS web crawler that discovers same-domain pages, resolves relative URLs, and avoids cycles.',
  type: QuestionType.FUNCTION_PYTHON,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['graph', 'bfs', 'string'],
  starterCode: {
    python: `from collections import deque

def web_crawl(pages, start_url):
    """
    Crawl all reachable same-domain pages starting from start_url.

    Args:
        pages: dict mapping URL -> list of links found on that page
        start_url: the URL to begin crawling from

    Returns:
        Sorted list of all visited URLs
    """
    return []
`,
  },
  publicTestCode: `test('single page with no links', () => {
  const pages = { "https://a.com": [] };
  expect(web_crawl(pages, "https://a.com")).toEqual(["https://a.com"]);
});

test('follows same-domain links only', () => {
  const pages = {
    "https://a.com": ["https://a.com/about", "https://b.com"],
    "https://a.com/about": [],
  };
  expect(web_crawl(pages, "https://a.com")).toEqual(["https://a.com", "https://a.com/about"]);
});`,
  hiddenTestCode: `test('resolves relative paths', () => {
  const pages = {
    "https://a.com": ["/about", "/blog"],
    "https://a.com/about": [],
    "https://a.com/blog": [],
  };
  expect(web_crawl(pages, "https://a.com")).toEqual([
    "https://a.com", "https://a.com/about", "https://a.com/blog"
  ]);
});

test('handles cycles without infinite loop', () => {
  const pages = {
    "https://a.com": ["https://a.com/one"],
    "https://a.com/one": ["https://a.com/two"],
    "https://a.com/two": ["https://a.com"],
  };
  expect(web_crawl(pages, "https://a.com")).toEqual([
    "https://a.com", "https://a.com/one", "https://a.com/two"
  ]);
});

test('skips pages not in the map (404)', () => {
  const pages = {
    "https://a.com": ["https://a.com/exists", "https://a.com/missing"],
    "https://a.com/exists": [],
  };
  expect(web_crawl(pages, "https://a.com")).toEqual([
    "https://a.com", "https://a.com/exists"
  ]);
});

test('deep chain', () => {
  const pages = {
    "https://x.com": ["https://x.com/1"],
    "https://x.com/1": ["https://x.com/2"],
    "https://x.com/2": ["https://x.com/3"],
    "https://x.com/3": [],
  };
  expect(web_crawl(pages, "https://x.com")).toEqual([
    "https://x.com", "https://x.com/1", "https://x.com/2", "https://x.com/3"
  ]);
});

test('mixed relative and absolute with cross-domain noise', () => {
  const pages = {
    "https://site.io": ["/docs", "https://site.io/api", "https://evil.com/hack"],
    "https://site.io/docs": ["/api", "https://other.org"],
    "https://site.io/api": ["/"],
  };
  expect(web_crawl(pages, "https://site.io")).toEqual([
    "https://site.io", "https://site.io/api", "https://site.io/docs"
  ]);
});

test('start url not in pages returns empty', () => {
  const pages = { "https://a.com/other": [] };
  expect(web_crawl(pages, "https://a.com")).toEqual([]);
});`,
  solutions: [
    {
      language: 'python',
      explanation: `## BFS + URL normalization

The crawler uses standard BFS graph traversal where each page is a node and links are edges.

### Origin extraction

Extract \`protocol + host\` from the start URL to filter same-domain links:

\`\`\`python
# "https://example.com/page" → "https://example.com"
origin = start_url[:start_url.index("/", 8)]  # skip "https://"
\`\`\`

This avoids importing \`urllib.parse\` — the third slash after \`https://\` always marks the path boundary.

### Relative URL resolution

Relative paths like \`"/about"\` are prepended with the origin:

\`\`\`python
if link.startswith("/"):
    link = origin + link
\`\`\`

### Same-domain check

A link belongs to the same domain if it starts with the origin string:

\`\`\`python
if link.startswith(origin):
    queue.append(link)
\`\`\`

### Cycle prevention

A \`visited\` set tracks seen URLs. Only enqueue links not yet visited. This guarantees each page is processed at most once — O(V + E) time complexity.`,
      code: `from collections import deque

def web_crawl(pages, start_url):
    # Extract origin: "https://example.com"
    slash = start_url.index("/", 8)  # find first "/" after "https://"
    origin = start_url[:slash] if slash > 0 else start_url

    visited = set()
    queue = deque()

    if start_url in pages:
        queue.append(start_url)
        visited.add(start_url)

    while queue:
        url = queue.popleft()
        for link in pages.get(url, []):
            # Resolve relative paths
            if link.startswith("/"):
                link = origin + link
            # Same-domain check + not visited + page exists
            if link.startswith(origin) and link not in visited and link in pages:
                visited.add(link)
                queue.append(link)

    return sorted(visited)`,
      complexity: 'O(V + E) where V = pages, E = total links',
    },
  ],
};
