import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const debounceFunction: SeedQuestion = {
  slug: 'debounce-function',
  title: 'Debounce Function',
  prompt: `Implement \`debounce(fn, delay)\`. The returned function delays calling \`fn\` until \`delay\` ms have passed since the *last* invocation — every new call resets the timer. Arguments and \`this\` from the most recent call are the ones that get used when \`fn\` finally fires.

\`\`\`js
const log = debounce((msg) => console.log(msg), 100);

log('a');
log('b');
log('c');
// 100ms after the last call, prints: c
\`\`\`

Then add two control methods on the returned function:

- \`debounced.cancel()\` — drop any pending call. After cancel, \`fn\` will not fire until a new invocation kicks off a fresh timer.
- \`debounced.flush()\` — if a call is pending, invoke \`fn\` immediately with the latest args and clear the timer. If nothing is pending, do nothing.

\`\`\`js
const save = debounce(persist, 500);

save(draft);
save.cancel();   // user navigated away — drop the pending save
save.flush();    // user hit ⌘S — fire now instead of waiting
\`\`\`

### Rules
1. Pass the latest call's arguments through to \`fn\`.
2. Preserve \`this\` — if \`debounced\` is called as a method, \`fn\` should see the same receiver.
3. Calling the debounced function while a timer is pending must *reset* the timer, not stack a second one.
4. \`cancel\` and \`flush\` must leave the debouncer in a clean state — the next call starts a fresh timer.

> [!tip] Interview Tip
> Hold three pieces of state in the closure: the active \`timeoutId\`, the latest \`args\`, and the latest \`this\`. Reassign all three on every call, clear them once \`fn\` fires (or on \`cancel\`/\`flush\`), so a stale call never leaks into the next cycle.

> [!note] Follow-up
> A common extension is a third \`{ immediate: true }\` option (a.k.a. leading-edge debounce) that fires \`fn\` on the *first* call and then suppresses subsequent calls until the quiet period passes. Think about how that interacts with \`flush\` — should flush re-invoke if leading-edge already fired? Lodash says no; that's the convention to follow.
`,
  description: 'Implement debounce(fn, delay) with .cancel() and .flush() control methods, preserving args and this.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  timeLimitMinutes: 30,
  tags: ['closure', 'timers', 'utility'],
  starterCode: {
    javascript: `function debounce(fn, delay) {
  // your code here
}`,
    typescript: `interface Debounced<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel(): void;
  flush(): void;
}

function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): Debounced<T> {
  // your code here
}`,
  },
  publicTestCode: `test('delays the call by the given wait time', (done) => {
  let called = 0;
  const fn = debounce(() => { called++; }, 50);
  fn();
  expect(called).toBe(0);
  setTimeout(() => {
    expect(called).toBe(1);
    done();
  }, 80);
});

test('resets the timer on subsequent calls', (done) => {
  let called = 0;
  const fn = debounce(() => { called++; }, 50);
  fn();
  setTimeout(() => fn(), 30); // resets — should fire ~80ms from t=0
  setTimeout(() => { expect(called).toBe(0); }, 60);
  setTimeout(() => {
    expect(called).toBe(1);
    done();
  }, 120);
});

test('uses the latest args when it finally fires', (done) => {
  let received;
  const fn = debounce((x) => { received = x; }, 50);
  fn('a');
  fn('b');
  fn('c');
  setTimeout(() => {
    expect(received).toBe('c');
    done();
  }, 80);
});`,
  hiddenTestCode: `test('many rapid calls only trigger fn once', (done) => {
  let count = 0;
  const fn = debounce(() => { count++; }, 50);
  fn(); fn(); fn(); fn(); fn();
  setTimeout(() => {
    expect(count).toBe(1);
    done();
  }, 80);
});

test('cancel drops the pending call', (done) => {
  let count = 0;
  const fn = debounce(() => { count++; }, 50);
  fn();
  fn.cancel();
  setTimeout(() => {
    expect(count).toBe(0);
    done();
  }, 80);
});

test('cancel leaves the debouncer reusable', (done) => {
  let count = 0;
  const fn = debounce(() => { count++; }, 50);
  fn();
  fn.cancel();
  fn();
  setTimeout(() => {
    expect(count).toBe(1);
    done();
  }, 80);
});

test('flush invokes fn immediately when a call is pending', () => {
  let received;
  const fn = debounce((x) => { received = x; }, 50);
  fn('hello');
  fn.flush();
  expect(received).toBe('hello');
});

test('flush clears the pending timer so fn does not fire again', (done) => {
  let count = 0;
  const fn = debounce(() => { count++; }, 50);
  fn();
  fn.flush();
  expect(count).toBe(1);
  setTimeout(() => {
    expect(count).toBe(1);
    done();
  }, 80);
});

test('flush is a no-op when nothing is pending', () => {
  let count = 0;
  const fn = debounce(() => { count++; }, 50);
  fn.flush();
  expect(count).toBe(0);
});

test('preserves this when called as a method', (done) => {
  const obj = {
    value: 42,
    seen: 0,
    handler: debounce(function () { this.seen = this.value; }, 30),
  };
  obj.handler();
  setTimeout(() => {
    expect(obj.seen).toBe(42);
    done();
  }, 60);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## State lives in the closure

The returned function is a *single instance* — it has to remember whether a timer is already running, what arguments to eventually pass through, and which receiver to call \`fn\` on. Stash all three in the closure:

- \`timeoutId\` — \`null\` when no call is pending; a timer id when one is queued. This is also the "is there work to flush?" flag.
- \`lastArgs\`, \`lastThis\` — overwritten on every invocation so \`fn\` always fires with the *most recent* call's data.

Every call:
1. Capture the new \`args\` and \`this\` (overwriting prior values).
2. \`clearTimeout(timeoutId)\` if one is pending — this is what makes it a *debounce* rather than a throttle.
3. Schedule a fresh timer and **assign its id back to \`timeoutId\`** so the next call can clear it.

When the timer finally fires, null out \`timeoutId\` *before* calling \`fn\`. If \`fn\` itself synchronously triggers another debounced call, the closure has to look idle, or the new call will think a timer is still pending and stomp on it.

## cancel and flush

Both share the same teardown — clear the timer, null the state — but \`flush\` invokes \`fn\` first with the captured args/this. The "no-op when nothing pending" rule falls out for free: \`timeoutId === null\` means there's nothing to flush or cancel.

\`\`\`js
function debounced(...args) {
  lastArgs = args;
  lastThis = this;
  if (timeoutId !== null) clearTimeout(timeoutId);
  timeoutId = setTimeout(invoke, delay);
}
\`\`\`

## Common bugs

- Forgetting to assign \`setTimeout\`'s return to \`timeoutId\`. Subsequent calls then can't reset the timer because \`clearTimeout(undefined)\` is a no-op, and you get multiple stacked invocations.
- Not nulling \`timeoutId\` before \`fn\` runs — re-entrant calls from inside \`fn\` see a stale id.
- Reading \`this\` from inside an arrow callback passed to \`setTimeout\` — by then the call-site \`this\` is gone. Capture it eagerly as \`lastThis\` at call time.

## Full Implementation`,
      code: `function debounce(fn, delay) {
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;

  function invoke() {
    const args = lastArgs;
    const ctx = lastThis;
    timeoutId = null;
    lastArgs = null;
    lastThis = null;
    fn.apply(ctx, args);
  }

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;
    if (timeoutId !== null) clearTimeout(timeoutId);
    timeoutId = setTimeout(invoke, delay);
  }

  debounced.cancel = function () {
    if (timeoutId !== null) clearTimeout(timeoutId);
    timeoutId = null;
    lastArgs = null;
    lastThis = null;
  };

  debounced.flush = function () {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      invoke();
    }
  };

  return debounced;
}`,
    },
  ],
};
