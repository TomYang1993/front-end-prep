import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const sequencedCountdownWithFinal: SeedQuestion = {
  slug: 'sequenced-countdown-with-final',
  title: 'Sequenced Countdown with Final',
  prompt: `Implement \`countdown(n, gapMs, log)\` that emits a sequence of values **spaced in time**, then a final summary.

The function should:

1. Call \`log(0)\` immediately.
2. Call \`log(i)\` exactly \`gapMs\` milliseconds after the previous \`log\` call, for every \`i\` in \`1..n-1\`.
3. \`gapMs\` after the last numeric call, call \`log(\\\`Final \${n}\\\`)\`.
4. Return a \`Promise<void>\` that resolves **after** the final log fires.

\`\`\`text
countdown(3, 100, console.log)

t=0ms    →  0
t=100ms  →  1
t=200ms  →  2
t=300ms  →  "Final 3"
\`\`\`

\`\`\`text
countdown(0, 100, console.log)

t=100ms  →  "Final 0"
\`\`\`

### Rules

1. Logs must fire in order: \`0, 1, 2, ..., n-1, "Final n"\`.
2. Consecutive logs must be **at least** \`gapMs\` apart — no firing them all in parallel.
3. \`n = 0\` skips the numeric phase and only logs \`"Final 0"\` after \`gapMs\`.
4. The returned Promise must not resolve before the final log.

> [!tip]
> Common trap: writing \`for (var i = 0; i < n; i++) setTimeout(() => log(i), i * gapMs)\` looks right but has two bugs — the closure captures the wrong \`i\`, and the loop fires all timers synchronously rather than sequencing them. Think about what you actually need to \`await\`.
`,
  description:
    'Emit timed values in sequence, then a final summary — exercises closures, setTimeout, and async sequencing.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['async', 'closure', 'event-loop'],
  starterCode: {
    javascript: `function countdown(n, gapMs, log) {
  // your code here
}
`,
    typescript: `function countdown(
  n: number,
  gapMs: number,
  log: (value: number | string) => void,
): Promise<void> {
  // your code here
}
`,
  },
  publicTestCode: `test('logs 0..n-1 then "Final n" in order', async () => {
  const calls = [];
  await countdown(3, 20, (v) => calls.push(v));
  expect(calls).toEqual([0, 1, 2, 'Final 3']);
});

test('returns a Promise that resolves after the final log', async () => {
  const calls = [];
  const p = countdown(2, 20, (v) => calls.push(v));
  expect(typeof p.then).toBe('function');
  await p;
  expect(calls[calls.length - 1]).toBe('Final 2');
});`,
  hiddenTestCode: `test('n = 0 only logs "Final 0"', async () => {
  const calls = [];
  await countdown(0, 20, (v) => calls.push(v));
  expect(calls).toEqual(['Final 0']);
});

test('n = 1 logs 0 then "Final 1"', async () => {
  const calls = [];
  await countdown(1, 20, (v) => calls.push(v));
  expect(calls).toEqual([0, 'Final 1']);
});

test('consecutive logs are at least gapMs apart — not fired in parallel', async () => {
  const times = [];
  await countdown(4, 30, () => times.push(Date.now()));
  for (let i = 1; i < times.length; i++) {
    expect(times[i] - times[i - 1]).toBeGreaterThanOrEqual(25);
  }
});

test('total runtime scales with n (sequential, not parallel)', async () => {
  const start = Date.now();
  await countdown(5, 25, () => {});
  // 5 numeric logs + 1 final = 5 gaps after the immediate first log
  expect(Date.now() - start).toBeGreaterThanOrEqual(5 * 25 - 10);
});

test('first numeric log fires immediately (no leading gap)', async () => {
  const start = Date.now();
  let firstAt = -1;
  await countdown(2, 50, (v) => {
    if (v === 0) firstAt = Date.now() - start;
  });
  expect(firstAt).toBeLessThan(30);
});

test('larger n preserves order', async () => {
  const calls = [];
  await countdown(8, 10, (v) => calls.push(v));
  expect(calls).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 'Final 8']);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## The naive attempt (and why it fails)

The reflex is:

\`\`\`js
for (var i = 0; i < n; i++) {
  setTimeout(() => log(i), i * gapMs);
}
\`\`\`

Two bugs in one line:

1. **Closure trap.** All callbacks capture the same \`var i\` by reference. By the time any timer fires, \`i === n\`, so every callback logs \`n\`.
2. **Parallel scheduling.** \`setTimeout\` doesn't wait — the loop synchronously queues all \`n\` timers at once. Even if the closure were fixed (e.g. \`let i\`), there's nothing to \`await\`, so the returned Promise has nothing to anchor on, and the function can't know when the final log has fired.

### Patching just the closure
\`let i\` fixes bug 1, but bug 2 remains. You'd need a separate "final" timer plus bookkeeping to resolve the outer Promise after the last numeric log. Workable, but brittle.

## The clean fix — async / await

Treat the timeline as a sequence of \`await\`-able pauses:

\`\`\`js
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function countdown(n, gapMs, log) {
  for (let i = 0; i < n; i++) {
    if (i > 0) await sleep(gapMs);
    log(i);
  }
  await sleep(gapMs);
  log(\`Final \${n}\`);
}
\`\`\`

**Why this works:**
- Each \`await sleep(gapMs)\` pauses the loop, so calls are spaced rather than queued.
- \`let i\` is block-scoped — even without it, each iteration's \`await\` keeps \`i\` stable for the surrounding log.
- The function is \`async\`, so it returns a Promise that resolves when the function body finishes — naturally **after** the final log.
- \`n = 0\` skips the loop entirely, then awaits one gap and logs Final.

## Alternative: chained \`.then\`

Equivalent without \`async/await\`, useful for understanding what the compiler does:

\`\`\`js
function countdown(n, gapMs, log) {
  let chain = Promise.resolve();
  for (let i = 0; i < n; i++) {
    chain = chain.then(() => {
      if (i > 0) return sleep(gapMs);
    }).then(() => log(i));
  }
  return chain.then(() => sleep(gapMs)).then(() => log(\`Final \${n}\`));
}
\`\`\`

## Alternative: recursive scheduling

\`\`\`js
function countdown(n, gapMs, log) {
  return new Promise((resolve) => {
    const step = (i) => {
      if (i === n) {
        setTimeout(() => { log(\`Final \${n}\`); resolve(); }, gapMs);
        return;
      }
      log(i);
      setTimeout(() => step(i + 1), gapMs);
    };
    step(0);
  });
}
\`\`\`

All three solutions pass; the async/await version is the one to write in 2026.`,
      code: `function countdown(n, gapMs, log) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  return (async () => {
    for (let i = 0; i < n; i++) {
      if (i > 0) await sleep(gapMs);
      log(i);
    }
    await sleep(gapMs);
    log(\`Final \${n}\`);
  })();
}`,
    },
  ],
};
