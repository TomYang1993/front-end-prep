import { describe, expect, it } from 'vitest';
import vm from 'node:vm';
import { TEST_HARNESS_CODE, TEST_COLLECT_CODE } from '@/lib/runners/test-harness';

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
});
