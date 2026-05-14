/**
 * Minimal test/expect/describe harness, injected as a string into the
 * JS test runner (currently a Web Worker — see lib/runners/client/js-test-worker.ts).
 * NOT a full Jest — just enough to support inline test code strings.
 *
 * Collects results into `__results`, which the runner reads after execution.
 * Async tests register their settled Promise in `__pendingAsync`; the runner
 * awaits these via TEST_COLLECT_ASYNC_CODE before serializing.
 */
export const TEST_HARNESS_CODE = `
const __results = [];
const __pendingAsync = [];

function __formatError(e) {
  if (!e) return 'Unknown error';
  const name = (e.constructor && e.constructor.name !== 'Error') ? e.constructor.name + ': ' : '';
  const msg = e.message || String(e);
  return name + msg;
}

function describe(name, fn) { fn(); }

function test(name, fn) {
  try {
    const result = fn(__doneFactory(name));
    if (result && typeof result.then === 'function') {
      __pendingAsync.push(
        result
          .then(() => __results.push({ name, passed: true }))
          .catch((e) => __results.push({ name, passed: false, error: __formatError(e) }))
      );
    } else if (fn.length === 0) {
      // Sync test with no done callback
      __results.push({ name, passed: true });
    }
    // If fn.length === 1, it uses done() — result pushed by __doneFactory
  } catch (e) {
    __results.push({ name, passed: false, error: __formatError(e) });
  }
}

function __doneFactory(name) {
  let called = false;
  return function done(err) {
    if (called) return;
    called = true;
    if (err) {
      __results.push({ name, passed: false, error: __formatError(err) });
    } else {
      __results.push({ name, passed: true });
    }
  };
}

function __asyncMatchers(promiseLike, negate) {
  function check(matcher, expected) {
    return Promise.resolve(promiseLike).then(
      (value) => {
        if (negate) {
          // .rejects but it resolved — fail
          throw new Error('Expected promise to reject, but it resolved with ' + JSON.stringify(value));
        }
        // run matcher against resolved value
        expect(value)[matcher](expected);
      },
      (err) => {
        if (!negate) {
          // .resolves but it rejected — fail
          throw new Error('Expected promise to resolve, but it rejected with ' + __formatError(err));
        }
        expect(err)[matcher](expected);
      }
    );
  }
  return {
    toBe: (expected) => check('toBe', expected),
    toEqual: (expected) => check('toEqual', expected),
    toBeTruthy: () => check('toBeTruthy'),
    toBeFalsy: () => check('toBeFalsy'),
    toBeNull: () => check('toBeNull'),
    toBeUndefined: () => check('toBeUndefined'),
    toContain: (item) => check('toContain', item),
    toBeGreaterThan: (n) => check('toBeGreaterThan', n),
    toBeLessThan: (n) => check('toBeLessThan', n),
    toHaveLength: (n) => check('toHaveLength', n),
    toBeInstanceOf: (cls) => check('toBeInstanceOf', cls),
  };
}

function expect(received) {
  return {
    get resolves() { return __asyncMatchers(received, false); },
    get rejects() { return __asyncMatchers(received, true); },
    toBe(expected) {
      if (!Object.is(received, expected)) {
        throw new Error('Expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(received));
      }
    },
    toEqual(expected) {
      if (JSON.stringify(received) !== JSON.stringify(expected)) {
        throw new Error('Expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(received));
      }
    },
    toBeTruthy() {
      if (!received) {
        throw new Error('Expected truthy, received ' + JSON.stringify(received));
      }
    },
    toBeFalsy() {
      if (received) {
        throw new Error('Expected falsy, received ' + JSON.stringify(received));
      }
    },
    toBeNull() {
      if (received !== null) {
        throw new Error('Expected null, received ' + JSON.stringify(received));
      }
    },
    toBeUndefined() {
      if (received !== undefined) {
        throw new Error('Expected undefined, received ' + JSON.stringify(received));
      }
    },
    toContain(item) {
      if (typeof received === 'string') {
        if (!received.includes(item)) {
          throw new Error('Expected string to contain ' + JSON.stringify(item));
        }
      } else if (Array.isArray(received)) {
        if (!received.includes(item)) {
          throw new Error('Expected array to contain ' + JSON.stringify(item));
        }
      } else {
        throw new Error('toContain requires string or array');
      }
    },
    toThrow(expectedMsg) {
      if (typeof received !== 'function') {
        throw new Error('toThrow requires a function');
      }
      let threw = false;
      let thrownError;
      try { received(); } catch (e) { threw = true; thrownError = e; }
      if (!threw) {
        throw new Error('Expected function to throw');
      }
      if (expectedMsg !== undefined) {
        const msg = thrownError && thrownError.message ? thrownError.message : String(thrownError);
        if (!msg.includes(expectedMsg)) {
          throw new Error('Expected throw message to contain ' + JSON.stringify(expectedMsg) + ', got ' + JSON.stringify(msg));
        }
      }
    },
    toBeGreaterThan(n) {
      if (!(received > n)) throw new Error('Expected ' + received + ' > ' + n);
    },
    toBeLessThan(n) {
      if (!(received < n)) throw new Error('Expected ' + received + ' < ' + n);
    },
    toHaveLength(n) {
      const len = received && received.length;
      if (len !== n) throw new Error('Expected length ' + n + ', received ' + len);
    },
    toBeInstanceOf(cls) {
      if (!(received instanceof cls)) {
        throw new Error('Expected instance of ' + (cls.name || cls));
      }
    },
  };
}

// Alias
const it = test;
`;

/**
 * Code appended after user code + test code to collect results.
 * Returns a JSON string synchronously — for sync-only sandboxes that can't await.
 */
export const TEST_COLLECT_CODE = `
JSON.stringify({ results: __results });
`;

/**
 * Async variant: awaits all pending async tests before serializing results.
 * Use in environments with a real event loop (Web Worker, Node).
 * Returns a Promise<string> of the results JSON.
 */
export const TEST_COLLECT_ASYNC_CODE = `
(async () => {
  try { await Promise.all(__pendingAsync); } catch (_e) { /* individual tests already recorded their errors */ }
  return JSON.stringify({ results: __results });
})()
`;
