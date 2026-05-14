import { describe, expect, it } from 'vitest';
import vm from 'node:vm';
import {
  TEST_HARNESS_CODE,
  TEST_COLLECT_CODE,
  TEST_COLLECT_ASYNC_CODE,
} from '@/lib/runners/test-harness';

interface HarnessResult {
  name: string;
  passed: boolean;
  error?: string;
}

function runHarness(testCode: string, userCode = ''): HarnessResult[] {
  const ctx: Record<string, unknown> = {};
  vm.createContext(ctx);
  vm.runInContext(TEST_HARNESS_CODE + '\n' + userCode + '\n' + testCode, ctx);
  const json = vm.runInContext(TEST_COLLECT_CODE, ctx) as string;
  return (JSON.parse(json) as { results: HarnessResult[] }).results;
}

async function runHarnessAsync(testCode: string, userCode = ''): Promise<HarnessResult[]> {
  // Node vm context has setTimeout/Promise natively via globals injection.
  const ctx: Record<string, unknown> = { setTimeout, clearTimeout, Promise };
  vm.createContext(ctx);
  vm.runInContext(TEST_HARNESS_CODE + '\n' + userCode + '\n' + testCode, ctx);
  const json = (await vm.runInContext(TEST_COLLECT_ASYNC_CODE, ctx)) as string;
  return (JSON.parse(json) as { results: HarnessResult[] }).results;
}

describe('test-harness', () => {
  it('records passing sync test', () => {
    const r = runHarness(`test('passes', () => { expect(1).toBe(1); });`);
    expect(r).toEqual([{ name: 'passes', passed: true }]);
  });

  it('records failing test with error message', () => {
    const r = runHarness(`test('fails', () => { expect(1).toBe(2); });`);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ name: 'fails', passed: false });
    expect(r[0].error).toContain('Expected 2, got 1');
  });

  it('describe groups invoke their fn synchronously', () => {
    const r = runHarness(`
      describe('group', () => {
        test('a', () => {});
        test('b', () => { throw new Error('boom'); });
      });
    `);
    expect(r.map(x => x.name)).toEqual(['a', 'b']);
    expect(r[0].passed).toBe(true);
    expect(r[1].passed).toBe(false);
    expect(r[1].error).toContain('boom');
  });

  it('it is alias of test', () => {
    const r = runHarness(`it('alias', () => { expect(true).toBeTruthy(); });`);
    expect(r).toEqual([{ name: 'alias', passed: true }]);
  });

  it('matcher: toEqual deep-equals via JSON', () => {
    const r = runHarness(`
      test('pass', () => { expect({a:1,b:[2,3]}).toEqual({a:1,b:[2,3]}); });
      test('fail', () => { expect({a:1}).toEqual({a:2}); });
    `);
    expect(r[0].passed).toBe(true);
    expect(r[1].passed).toBe(false);
  });

  it('matcher: toBeTruthy / toBeFalsy', () => {
    const r = runHarness(`
      test('truthy-ok', () => expect(1).toBeTruthy());
      test('truthy-no', () => expect(0).toBeTruthy());
      test('falsy-ok', () => expect(null).toBeFalsy());
      test('falsy-no', () => expect('x').toBeFalsy());
    `);
    expect(r.map(x => x.passed)).toEqual([true, false, true, false]);
  });

  it('matcher: toBeNull / toBeUndefined', () => {
    const r = runHarness(`
      test('null-ok', () => expect(null).toBeNull());
      test('null-no', () => expect(undefined).toBeNull());
      test('undef-ok', () => expect(undefined).toBeUndefined());
    `);
    expect(r.map(x => x.passed)).toEqual([true, false, true]);
  });

  it('matcher: toContain on string and array', () => {
    const r = runHarness(`
      test('s-ok', () => expect('hello world').toContain('world'));
      test('s-no', () => expect('hi').toContain('xx'));
      test('a-ok', () => expect([1,2,3]).toContain(2));
      test('a-no', () => expect([1,2]).toContain(9));
    `);
    expect(r.map(x => x.passed)).toEqual([true, false, true, false]);
  });

  it('matcher: toThrow with and without message', () => {
    const r = runHarness(`
      test('throws', () => expect(() => { throw new Error('boom'); }).toThrow());
      test('throws-msg', () => expect(() => { throw new Error('boom'); }).toThrow('boom'));
      test('not-throw', () => expect(() => 1).toThrow());
    `);
    expect(r.map(x => x.passed)).toEqual([true, true, false]);
  });

  it('matcher: toBeGreaterThan / toBeLessThan / toHaveLength', () => {
    const r = runHarness(`
      test('gt-ok', () => expect(5).toBeGreaterThan(3));
      test('lt-ok', () => expect(2).toBeLessThan(3));
      test('len-ok', () => expect([1,2,3]).toHaveLength(3));
      test('len-no', () => expect('hi').toHaveLength(5));
    `);
    expect(r.map(x => x.passed)).toEqual([true, true, true, false]);
  });

  it('user code globals are accessible to tests', () => {
    const userCode = `function add(a,b){return a+b}`;
    const r = runHarness(
      `test('uses user fn', () => { expect(add(2,3)).toBe(5); });`,
      userCode
    );
    expect(r[0].passed).toBe(true);
  });

  it('synchronous test that throws is captured, not propagated', () => {
    expect(() =>
      runHarness(`test('boom', () => { throw new Error('oops'); });`)
    ).not.toThrow();
  });

  describe('async path (TEST_COLLECT_ASYNC_CODE)', () => {
    it('drains setTimeout-based async test (the delayedLog scenario)', async () => {
      const userCode = `
        function delayedLog(n) {
          const fns = [];
          for (let i = 0; i < n; i++) {
            fns.push(() => new Promise(r => setTimeout(() => r(i), 5)));
          }
          return fns;
        }
      `;
      const r = await runHarnessAsync(
        `test('each resolves to own index', async () => {
          const fns = delayedLog(3);
          await expect(fns[0]()).resolves.toBe(0);
          await expect(fns[1]()).resolves.toBe(1);
          await expect(fns[2]()).resolves.toBe(2);
        });`,
        userCode
      );
      expect(r).toEqual([{ name: 'each resolves to own index', passed: true }]);
    });

    it('catches a wrong .resolves expectation', async () => {
      const r = await runHarnessAsync(
        `test('wrong', async () => {
          await expect(Promise.resolve(1)).resolves.toBe(2);
        });`
      );
      expect(r[0].passed).toBe(false);
      expect(r[0].error).toContain('Expected 2, got 1');
    });

    it('.rejects matches a rejecting promise', async () => {
      const r = await runHarnessAsync(
        `test('rejects', async () => {
          await expect(Promise.reject(new Error('nope'))).rejects.toBeInstanceOf(Error);
        });`
      );
      expect(r[0].passed).toBe(true);
    });

    it('.resolves fails when promise rejects', async () => {
      const r = await runHarnessAsync(
        `test('should resolve', async () => {
          await expect(Promise.reject(new Error('oops'))).resolves.toBe(1);
        });`
      );
      expect(r[0].passed).toBe(false);
      expect(r[0].error).toContain('rejected');
    });

    // Mirrors the worker's exact composition:
    //   new Function('console', `${HARNESS}\n${user}\n${tests}\nreturn ${ASYNC_COLLECT};`)
    // Catches ASI / return-newline regressions that vm.runInContext doesn't.
    it('works inside `new Function` with a trailing return — worker shape', async () => {
      const userCode = `
        function delayedLog(n) {
          const fns = [];
          for (let i = 0; i < n; i++) {
            fns.push(() => new Promise(r => setTimeout(() => r(i), 5)));
          }
          return fns;
        }
      `;
      const testCode = `
        test('each resolves to own index', async () => {
          const fns = delayedLog(3);
          await expect(fns[0]()).resolves.toBe(0);
          await expect(fns[1]()).resolves.toBe(1);
          await expect(fns[2]()).resolves.toBe(2);
        });
      `;
      const body = `
        ${TEST_HARNESS_CODE}
        ${userCode}
        ${testCode}
        return ${TEST_COLLECT_ASYNC_CODE};
      `;
      const runner = new Function(body) as () => Promise<string>;
      const jsonOut = await runner();
      expect(typeof jsonOut).toBe('string');
      const parsed = JSON.parse(jsonOut) as { results: HarnessResult[] };
      expect(parsed.results).toEqual([{ name: 'each resolves to own index', passed: true }]);
    });
  });
});
