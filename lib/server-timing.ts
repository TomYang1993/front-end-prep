/**
 * Lightweight request timer for server components and API routes.
 *
 * Usage:
 *   const t = createTimer('GET /questions');
 *   const user = await t.time('auth', getCurrentServerUser());
 *   const data = await t.time('query', fetchData());
 *   t.summary();  // prints breakdown to terminal
 */

interface TimerEntry {
  label: string;
  ms: number;
}

export function createTimer(name?: string) {
  const entries: TimerEntry[] = [];
  const requestStart = performance.now();

  return {
    /** Wrap a promise and measure how long it takes */
    async time<T>(label: string, promise: Promise<T>): Promise<T> {
      const start = performance.now();
      const result = await promise;
      entries.push({ label, ms: performance.now() - start });
      return result;
    },

    /** Print a one-line breakdown to the terminal */
    summary() {
      const total = performance.now() - requestStart;
      const parts = entries.map((e) => `${e.label}=${e.ms.toFixed(0)}ms`).join('  ');
      console.log(`⏱  ${name ?? 'request'}  ${parts}  total=${total.toFixed(0)}ms`);
    },
  };
}
