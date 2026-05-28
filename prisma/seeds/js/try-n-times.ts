import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const tryNTimes: SeedQuestion = {
  slug: 'try-n-times',
  title: 'Retry an Async Operation',
  prompt: `Implement \`retry(fn, times, interval)\` — a retry helper for flaky async work.

\`\`\`js
const getJSON = () =>
  new Promise((resolve, reject) =>
    setTimeout(() => reject('reject'), 500)
  );

await retry(getJSON, 4, 1);
// attempts 1, 2, 3 fail → waits 1s, 2s, 4s between them.
// attempt 4 fails → rejects with the last error (no trailing wait).
\`\`\`

**Rules:**
- \`fn\` is an async function.
- If it rejects, wait, then try again — up to \`times\` total attempts.
- The wait **doubles** every retry: \`interval\`, \`interval * 2\`, \`interval * 4\`, … (so the wait before attempt \`N + 1\` is \`interval * 2^(N - 1)\` seconds).
- If all attempts fail, reject with the **last error** thrown.
- Do **not** wait after the final failure. No point sleeping when nothing will follow it.

**Examples:**

\`\`\`js
// Succeeds on first attempt — fn called once, no delay.
await retry(async () => 'ok', 3, 0);            // => 'ok'

// Flaky: fails twice then succeeds.
let n = 0;
const flaky = async () => { n++; if (n < 3) throw 'nope'; return 'win'; };
await retry(flaky, 5, 0);                       // => 'win', fn called 3 times

// Exhausts attempts — rejects with the *last* error.
await retry(async () => { throw new Error('boom'); }, 3, 0);
// => rejects with Error('boom')
\`\`\`
`,
  description: 'Retry a Promise-returning function up to N times with an exponentially increasing delay between attempts.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  timeLimitMinutes: 30,
  tags: ['async', 'promise', 'error-handling'],
  starterCode: {
    javascript: `function delay(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function tryNTimes(fn, times = 3, interval = 1) {
  // Retry fn up to \`times\` total attempts.
  // Wait doubles each retry: interval, interval*2, interval*4, …
  // Reject with the last error if all attempts fail.
}`,
  },
  publicTestCode: `test('resolves on first attempt', async () => {
  let calls = 0;
  const fn = async () => { calls++; return 'ok'; };
  await expect(tryNTimes(fn, 3, 0)).resolves.toBe('ok');
  expect(calls).toBe(1);
});

test('retries until success', async () => {
  let calls = 0;
  const fn = async () => {
    calls++;
    if (calls < 3) throw new Error('flaky');
    return 'win';
  };
  await expect(tryNTimes(fn, 5, 0)).resolves.toBe('win');
  expect(calls).toBe(3);
});

test('rejects with the last error after exhausting attempts', async () => {
  let calls = 0;
  const fn = async () => { calls++; throw new Error('fail-' + calls); };
  await expect(tryNTimes(fn, 3, 0)).rejects.toThrow('fail-3');
  expect(calls).toBe(3);
});`,
  hiddenTestCode: `test('calls fn exactly \`times\` times when always failing', async () => {
  let calls = 0;
  const fn = async () => { calls++; throw new Error('nope'); };
  await expect(tryNTimes(fn, 4, 0)).rejects.toThrow();
  expect(calls).toBe(4);
});

test('preserves non-Error rejection values', async () => {
  const fn = async () => { throw 'string-reason'; };
  await expect(tryNTimes(fn, 2, 0)).rejects.toBe('string-reason');
});

test('waits with exponential backoff between attempts', async () => {
  let calls = 0;
  const fn = async () => { calls++; throw new Error('x'); };
  const start = Date.now();
  await expect(tryNTimes(fn, 3, 0.05)).rejects.toThrow();
  const elapsed = Date.now() - start;
  // Gaps double: ~50ms then ~100ms between three attempts. Allow generous slack.
  expect(elapsed).toBeGreaterThanOrEqual(130);
  expect(elapsed).toBeLessThan(500);
  expect(calls).toBe(3);
});

test('does not wait after the final failure', async () => {
  const fn = async () => { throw new Error('x'); };
  const start = Date.now();
  await expect(tryNTimes(fn, 2, 0.2)).rejects.toThrow();
  // 2 attempts, one ~200ms gap between them. No extra delay after the last failure.
  expect(Date.now() - start).toBeLessThan(350);
});

test('does not retry after success', async () => {
  let calls = 0;
  const fn = async () => { calls++; return 42; };
  const result = await tryNTimes(fn, 5, 0);
  expect(result).toBe(42);
  expect(calls).toBe(1);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## How it works

A retry boils down to: try, catch, sleep, repeat. The whole helper is a \`for\` loop wrapped around \`await fn()\` inside a \`try/catch\`.

\`\`\`js
for (let attempt = 1; attempt <= times; attempt++) {
  try {
    return await fn();
  } catch (err) {
    lastError = err;
    if (attempt < times) await delay(interval * 2 ** (attempt - 1));
  }
}
throw lastError;
\`\`\`

\`return await fn()\` exits the loop the moment something resolves. Every rejection lands in the \`catch\`, which stashes the error and — unless this was the last attempt — sleeps before the next iteration. After the loop ends, we throw whatever the most recent attempt rejected with, so callers see the real cause (e.g. \`ECONNREFUSED\`) rather than a generic "retry failed" message.

## Why \`return await fn()\` and not \`return fn()\`

\`return fn()\` hands the promise back directly, and its rejection propagates **outside** the surrounding \`try/catch\` — the catch never runs, the retry loop never sees the failure, and the helper degenerates into a one-shot call. \`await\` pulls the rejection into the catch block where it can actually be handled.

## Exponential backoff

A fixed interval hammers a struggling service at the same cadence — fine for a flaky local mock, hostile to a real backend that needs breathing room. Doubling the wait each retry (\`interval * 2^(attempt - 1)\`) gives the dependency exponentially more time to recover while keeping the early retries snappy. That's the shape AWS, gRPC, and most HTTP clients use; production code typically adds **jitter** on top so a thundering herd of clients doesn't all retry in lockstep, but the doubling is the core idea.

## Skipping the trailing delay

After the final attempt fails, there's no next attempt to wait for. Guarding the sleep with \`if (attempt < times)\` lets the helper reject immediately on exhaustion instead of burning a full backoff window after a guaranteed failure.

## Preserving the original rejection

Rejections in JS can be any value — \`Error\` instances, strings, numbers, objects. The catch parameter \`err\` is whatever the caller threw; storing and re-throwing it verbatim preserves the type. Wrapping in \`new Error(...)\` would lose information the caller may need.`,
      code: `function delay(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function tryNTimes(fn, times = 3, interval = 1) {
  let lastError;
  for (let attempt = 1; attempt <= times; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < times) await delay(interval * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}`,
    },
  ],
};
