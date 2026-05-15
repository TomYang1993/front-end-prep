import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const tryNTimes: SeedQuestion = {
  slug: 'try-n-times',
  title: 'Retry an Async Operation N Times',
  prompt: `Implement \`tryNTimes(fn, times = 3, interval = 1)\` — a retry helper for flaky async work (network calls, race-y reads, transient failures).

\`\`\`js
const getJSON = () =>
  new Promise((resolve, reject) =>
    setTimeout(() => reject('reject'), 500)
  );

await tryNTimes(getJSON, 5, 2);
// calls getJSON up to 5 times, waits 2 seconds between attempts,
// rejects with the last error if all 5 attempts fail.
\`\`\`

**Rules:**
- \`fn\` is a function that returns a Promise. Call it; if it resolves, return the resolved value.
- If it rejects, wait \`interval\` **seconds**, then try again — up to \`times\` total attempts.
- If all attempts fail, reject with the **last error** thrown (not a generic message — the caller wants to know what actually broke).
- Do **not** wait after the final failure. No point sleeping when nothing will follow it.
- If \`times < 1\`, throw synchronously (or reject) with a clear message — zero retries means the helper is doing nothing.

**Examples:**

\`\`\`js
// Succeeds on first attempt — fn called once, no delay.
await tryNTimes(async () => 'ok', 3, 0);            // => 'ok'

// Flaky: fails twice then succeeds.
let n = 0;
const flaky = async () => { n++; if (n < 3) throw 'nope'; return 'win'; };
await tryNTimes(flaky, 5, 0);                       // => 'win', fn called 3 times

// Exhausts attempts — rejects with the *last* error.
await tryNTimes(async () => { throw new Error('boom'); }, 3, 0);
// => rejects with Error('boom')
\`\`\`

> [!tip] Interview Tip
> The pattern is a loop with \`await fn()\` inside a \`try/catch\` — rejection becomes a regular catch branch, and \`return await fn()\` exits the loop on success. Two easy bugs to avoid: catching at the outer level (swallows the final error so the caller sees \`undefined\` instead of a rejection), and delaying after the **last** attempt (wastes time for no retry).
`,
  description: 'Retry a Promise-returning function up to N times with a fixed delay between attempts.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['async', 'promise', 'error-handling'],
  starterCode: {
    javascript: `function delay(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function tryNTimes(fn, times = 3, interval = 1) {
  // Retry fn up to \`times\` total attempts, waiting \`interval\` seconds between.
  // Reject with the last error if all attempts fail.
  // Throw if times < 1.
}`,
    typescript: `function delay(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function tryNTimes<T>(
  fn: () => Promise<T>,
  times: number = 3,
  interval: number = 1
): Promise<T> {
  // Retry fn up to \`times\` total attempts, waiting \`interval\` seconds between.
  // Reject with the last error if all attempts fail.
  // Throw if times < 1.
  throw new Error('not implemented');
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
  hiddenTestCode: `test('throws (or rejects) when times < 1', async () => {
  const fn = async () => 'ok';
  await expect(
    Promise.resolve().then(() => tryNTimes(fn, 0, 0))
  ).rejects.toThrow();
});

test('calls fn exactly \`times\` times when always failing', async () => {
  let calls = 0;
  const fn = async () => { calls++; throw new Error('nope'); };
  await expect(tryNTimes(fn, 4, 0)).rejects.toThrow();
  expect(calls).toBe(4);
});

test('preserves non-Error rejection values', async () => {
  const fn = async () => { throw 'string-reason'; };
  await expect(tryNTimes(fn, 2, 0)).rejects.toBe('string-reason');
});

test('waits \`interval\` seconds between attempts', async () => {
  let calls = 0;
  const fn = async () => { calls++; throw new Error('x'); };
  const start = Date.now();
  await expect(tryNTimes(fn, 3, 0.05)).rejects.toThrow();
  const elapsed = Date.now() - start;
  // Two gaps of ~50ms between three attempts. Allow generous slack.
  expect(elapsed).toBeGreaterThanOrEqual(80);
  expect(elapsed).toBeLessThan(500);
  expect(calls).toBe(3);
});

test('does not wait after the final failure', async () => {
  const fn = async () => { throw new Error('x'); };
  const start = Date.now();
  await expect(tryNTimes(fn, 1, 1)).rejects.toThrow();
  // times=1 means one attempt and no delay should happen at all.
  expect(Date.now() - start).toBeLessThan(200);
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
      explanation: `## The shape

\`async\` + \`try/catch\` + a loop. The whole thing collapses to:

\`\`\`js
for (let attempt = 1; attempt <= times; attempt++) {
  try {
    return await fn();
  } catch (err) {
    lastError = err;
    if (attempt < times) await delay(interval);
  }
}
throw lastError;
\`\`\`

\`return await fn()\` exits the loop the moment something resolves. Every rejection flows into the \`catch\`, which records the error and (unless this was the last attempt) sleeps before the next iteration.

## Things to get right

1. **Throw the actual last error, not a generic one.** "Attempted too many times" loses the cause. The caller wants to log \`ECONNREFUSED\`, not your retry message.
2. **Skip the delay after the final failure.** If \`attempt === times\` and \`fn\` just rejected, sleeping accomplishes nothing — we're about to throw.
3. **Validate \`times >= 1\`.** Zero retries means the helper does literally nothing; that's almost certainly a caller bug. Fail loudly.
4. **No outer \`try/catch\` around the loop.** A common mistake is wrapping the loop in another \`try { ... } catch { console.log(err) }\` — that swallows the rejection so the function resolves with \`undefined\` instead of rejecting. The caller's \`.catch()\` never fires.

## Why \`return await\` (not just \`return fn()\`)

If you write \`return fn()\`, the function returns the unwrapped promise — but a rejection from \`fn\` then propagates **outside** the \`try/catch\`, so the catch never runs and the retry loop is dead code. \`await\` pulls the rejection into the catch where you can handle it.

## What the candidate's draft gets wrong

\`\`\`js
try {
  while (true) {
    try { ... }
    catch (error) {
      if (++attemptCount >= times) throw new Error("attempted too many times");
      ...
    }
    await delay(interval);
  }
} catch (error) {
  console.log(error);  // ← swallows the failure
}
\`\`\`

Three bugs:
- The outer \`try/catch\` **consumes** the final throw, so the function resolves with \`undefined\`. Callers can't \`.catch()\`.
- \`new Error("attempted too many times")\` discards the actual cause.
- After the final \`throw\`, control technically still falls through to \`await delay(interval)\` on the next loop iteration — except it doesn't, because the throw exited the loop. Harmless but easy to write a worse version that does delay an extra cycle.`,
      code: `function delay(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function tryNTimes(fn, times = 3, interval = 1) {
  if (times < 1) {
    throw new Error(\`Bad argument: 'times' must be >= 1, got \${times}\`);
  }

  let lastError;
  for (let attempt = 1; attempt <= times; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < times) await delay(interval);
    }
  }
  throw lastError;
}`,
    },
  ],
};
