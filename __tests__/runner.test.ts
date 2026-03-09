import { describe, expect, test } from 'vitest';
import { FunctionJsRunner } from '@/lib/runners/adapters/function-js';
import { ReactPreviewRunner } from '@/lib/runners/adapters/react';

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

describe('ReactPreviewRunner', () => {
  test('requires default export', async () => {
    const runner = new ReactPreviewRunner();
    const result = await runner.run('const x = 1;', {}, {});

    expect(result.passed).toBe(false);
    expect(result.error).toContain('export');
  });

  test('renders a simple component and passes preview mode', async () => {
    const runner = new ReactPreviewRunner();
    const result = await runner.run(
      'export default function App() { return React.createElement("div", null, "Hello World"); }',
      {},
      { preview: true }
    );

    expect(result.passed).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('containsText assertion passes when text is present', async () => {
    const runner = new ReactPreviewRunner();
    const result = await runner.run(
      'export default function App() { return React.createElement("h1", null, "Welcome"); }',
      {},
      { containsText: ['Welcome'] }
    );

    expect(result.passed).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('containsText assertion fails when text is missing', async () => {
    const runner = new ReactPreviewRunner();
    const result = await runner.run(
      'export default function App() { return React.createElement("div", null, "Hello"); }',
      {},
      { containsText: ['Goodbye'] }
    );

    expect(result.passed).toBe(false);
    expect(result.error).toContain('Goodbye');
  });

  test('querySelector assertion passes when element exists', async () => {
    const runner = new ReactPreviewRunner();
    const result = await runner.run(
      'export default function App() { return React.createElement("button", { className: "submit-btn" }, "Click me"); }',
      {},
      { querySelector: '.submit-btn' }
    );

    expect(result.passed).toBe(true);
  });

  test('querySelector assertion fails when element missing', async () => {
    const runner = new ReactPreviewRunner();
    const result = await runner.run(
      'export default function App() { return React.createElement("div", null, "No button"); }',
      {},
      { querySelector: '.submit-btn' }
    );

    expect(result.passed).toBe(false);
    expect(result.error).toContain('.submit-btn');
  });

  test('containsTag assertion works', async () => {
    const runner = new ReactPreviewRunner();
    const result = await runner.run(
      'export default function App() { return React.createElement("form", null, React.createElement("input", { type: "text" })); }',
      {},
      { containsTag: 'input' }
    );

    expect(result.passed).toBe(true);
  });

  test('querySelectorAll count assertion works', async () => {
    const runner = new ReactPreviewRunner();
    const result = await runner.run(
      `export default function App() {
        return React.createElement("ul", null,
          React.createElement("li", null, "A"),
          React.createElement("li", null, "B"),
          React.createElement("li", null, "C")
        );
      }`,
      {},
      { querySelectorAll: { selector: 'li', count: 3 } }
    );

    expect(result.passed).toBe(true);
  });

  test('handles component that throws during render', async () => {
    const runner = new ReactPreviewRunner();
    const result = await runner.run(
      'export default function App() { throw new Error("Render crash"); }',
      {},
      { preview: true }
    );

    expect(result.passed).toBe(false);
    expect(result.error).toContain('Render crash');
  });

  test('renders component with props', async () => {
    const runner = new ReactPreviewRunner();
    const result = await runner.run(
      'export default function App(props) { return React.createElement("span", null, props.name); }',
      { props: { name: 'Tom' } },
      { containsText: ['Tom'] }
    );

    expect(result.passed).toBe(true);
  });
});
