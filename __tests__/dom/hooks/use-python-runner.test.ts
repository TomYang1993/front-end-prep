import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

type Listener = (e: MessageEvent) => void;

class MockWorker {
  static instances: MockWorker[] = [];
  listeners = new Set<Listener>();
  posted: { type: string; testId?: string; [k: string]: unknown }[] = [];
  terminated = false;

  constructor(public url: string) {
    MockWorker.instances.push(this);
  }
  postMessage(msg: { type: string; testId?: string }) {
    this.posted.push(msg);
  }
  addEventListener(_: string, fn: Listener) {
    this.listeners.add(fn);
  }
  removeEventListener(_: string, fn: Listener) {
    this.listeners.delete(fn);
  }
  terminate() {
    this.terminated = true;
  }
  emit(data: unknown) {
    for (const l of this.listeners) l({ data } as MessageEvent);
  }
  emitReady() {
    this.emit({ type: 'READY' });
  }
  emitResult(testId: string, output: unknown, extra: Record<string, unknown> = {}) {
    this.emit({ type: 'RESULT', testId, output, runtimeMs: 1, logs: [], ...extra });
  }
}

beforeEach(() => {
  MockWorker.instances = [];
  (globalThis as unknown as { Worker: typeof MockWorker }).Worker = MockWorker;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('usePythonRunner', () => {
  it('runTests resolves [] when given empty tests, regardless of worker state', async () => {
    const { usePythonRunner } = await import('@/hooks/use-python-runner');
    const { result } = renderHook(() => usePythonRunner(false));
    await expect(result.current.runTests('print(1)', [])).resolves.toEqual([]);
  });

  it('runTests rejects when worker not initialized (enabled=false)', async () => {
    const { usePythonRunner } = await import('@/hooks/use-python-runner');
    const { result } = renderHook(() => usePythonRunner(false));
    await expect(
      result.current.runTests('print(1)', [{ id: 't1', input: {}, expected: 1 }])
    ).rejects.toThrow(/not initialized/);
  });

  it('aligns results by testId regardless of return order', async () => {
    const { usePythonRunner } = await import('@/hooks/use-python-runner');
    const { result } = renderHook(() => usePythonRunner(true));
    const worker = MockWorker.instances[0];
    expect(worker).toBeDefined();
    act(() => worker.emitReady());

    const tests = [
      { id: 'a', input: { args: [1] }, expected: 10 },
      { id: 'b', input: { args: [2] }, expected: 20 },
      { id: 'c', input: { args: [3] }, expected: 30 }
    ];
    let promise!: Promise<unknown>;
    act(() => {
      promise = result.current.runTests('def solve(x): ...', tests);
    });

    act(() => {
      worker.emitResult('c', 30);
      worker.emitResult('a', 10);
      worker.emitResult('b', 99);
    });

    const out = (await promise) as Array<{
      id: string;
      output: unknown;
      passed: boolean;
    }>;

    expect(out.map(r => r.id)).toEqual(['a', 'b', 'c']);
    expect(out[0]).toMatchObject({ id: 'a', output: 10, passed: true });
    expect(out[1]).toMatchObject({ id: 'b', output: 99, passed: false });
    expect(out[2]).toMatchObject({ id: 'c', output: 30, passed: true });
  });

  it('rejects after 30s timeout when results never arrive', async () => {
    vi.useFakeTimers();
    const { usePythonRunner } = await import('@/hooks/use-python-runner');
    const { result } = renderHook(() => usePythonRunner(true));
    const worker = MockWorker.instances[0];
    act(() => worker.emitReady());

    let promise!: Promise<unknown>;
    act(() => {
      promise = result.current.runTests('code', [
        { id: 't1', input: { args: [] }, expected: 1 }
      ]);
    });
    promise.catch(() => {}); // suppress unhandled while we advance timers

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    await expect(promise).rejects.toThrow(/timed out/);
  });
});
