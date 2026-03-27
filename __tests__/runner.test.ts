import { describe, expect, test } from 'vitest';
import { FunctionJsRunner } from '@/lib/runners/adapters/function-js';

describe('FunctionJsRunner', () => {
  test('passes when result matches expected', async () => {
    const runner = new FunctionJsRunner();
    const result = await runner.run(
      'function solve(nums, target) { const m = new Map(); for (let i = 0; i < nums.length; i++) { if (m.has(target - nums[i])) return [m.get(target - nums[i]), i]; m.set(nums[i], i); } return []; }',
      { args: [[2, 7], 9] },
      [0, 1]
    );

    expect(result.passed).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('fails when result does not match expected', async () => {
    const runner = new FunctionJsRunner();
    const result = await runner.run(
      'function solve() { return 42; }',
      { args: [] },
      99
    );

    expect(result.passed).toBe(false);
    expect(result.error).toBeUndefined(); // no runtime error, just wrong answer
  });

  test('fails with error when solve is not defined', async () => {
    const runner = new FunctionJsRunner();
    const result = await runner.run('const x = 1;', { args: [] }, 1);

    expect(result.passed).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('blocks access to process and require', async () => {
    const runner = new FunctionJsRunner();
    const result = await runner.run(
      'function solve() { return typeof process; }',
      { args: [] },
      'undefined'
    );

    expect(result.passed).toBe(true);
  });

  test('blocks eval inside sandbox', async () => {
    const runner = new FunctionJsRunner();
    const result = await runner.run(
      'function solve() { return eval("1+1"); }',
      { args: [] },
      2
    );

    expect(result.passed).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('times out on infinite loops', async () => {
    const runner = new FunctionJsRunner();
    const result = await runner.run(
      'function solve() { while(true) {} }',
      { args: [] },
      null
    );

    expect(result.passed).toBe(false);
    expect(result.error).toBeTruthy();
  }, 10_000);
});
