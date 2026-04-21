import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const eventLoopOutput: SeedQuestion = {
  slug: 'event-loop-output',
  title: 'Predict the Event Loop Output',
  prompt: `This is a **behavioral** question — you don't write a function from scratch. Instead, implement \`predictOutput()\` that returns an array of strings in the **exact order** they would be logged by the following code:

\`\`\`js
console.log('A');

setTimeout(() => console.log('B'), 0);

Promise.resolve()
  .then(() => console.log('C'))
  .then(() => console.log('D'));

setTimeout(() => console.log('E'), 0);

Promise.resolve().then(() => {
  console.log('F');
  setTimeout(() => console.log('G'), 0);
});

console.log('H');
\`\`\`

Return the letters in the order they appear in the console:

\`\`\`js
predictOutput(); // ['A', 'H', 'C', 'F', 'D', 'B', 'E', 'G']  (or is it?)
\`\`\`

### Key concepts to reason about:
- **Call stack** — synchronous code runs first
- **Microtask queue** — \`Promise.then\` callbacks (higher priority)
- **Macrotask queue** — \`setTimeout\` callbacks (lower priority)
- Microtasks are drained **completely** before the next macrotask runs`,
  description: 'Given a mix of sync code, Promises, and setTimeout, predict the exact console output order.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['event-loop', 'async'],
  starterCode: {
    javascript: `function predictOutput() {
  // Return an array of letters in the order they would be logged
  // Hint: think about call stack, microtask queue, and macrotask queue
  return [];
}`,
    typescript: `function predictOutput(): string[] {
  // Return an array of letters in the order they would be logged
  // Hint: think about call stack, microtask queue, and macrotask queue
  return [];
}`,
  },
  publicTestCode: `test('synchronous code runs first', () => {
  const result = predictOutput();
  expect(result[0]).toBe('A');
  expect(result[1]).toBe('H');
});

test('microtasks (Promise.then) run before macrotasks (setTimeout)', () => {
  const result = predictOutput();
  const cIndex = result.indexOf('C');
  const bIndex = result.indexOf('B');
  expect(cIndex).toBeLessThan(bIndex);
});`,
  hiddenTestCode: `test('full output order is correct', () => {
  expect(predictOutput()).toEqual(['A', 'H', 'C', 'F', 'D', 'B', 'E', 'G']);
});

test('returns exactly 8 items', () => {
  expect(predictOutput()).toHaveLength(8);
});

test('G is last — scheduled from inside a microtask, queued after B and E', () => {
  const result = predictOutput();
  expect(result[result.length - 1]).toBe('G');
});

test('D follows C — chained .then on same promise', () => {
  const result = predictOutput();
  expect(result.indexOf('D')).toBe(result.indexOf('C') + 2);
});

test('F runs before D — separate Promise.resolve().then is a new microtask', () => {
  const result = predictOutput();
  expect(result.indexOf('F')).toBeLessThan(result.indexOf('D'));
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## Step-by-step execution

### Phase 1: Call stack (synchronous)
1. \`console.log('A')\` → **A**
2. \`setTimeout(B, 0)\` — schedules B in macrotask queue
3. \`Promise.resolve().then(C).then(D)\` — queues C as microtask; D waits for C
4. \`setTimeout(E, 0)\` — schedules E in macrotask queue (after B)
5. \`Promise.resolve().then(F+G)\` — queues F as microtask
6. \`console.log('H')\` → **H**

Call stack empty. Drain microtask queue.

### Phase 2: Microtask queue
7. Run C → **C** — this resolves the first \`.then\`, so D is now queued as a microtask
8. Run F → **F** — inside, \`setTimeout(G, 0)\` adds G to macrotask queue (after B, E)
9. Run D → **D** — (was queued when C resolved)

Microtask queue empty. Process macrotask queue.

### Phase 3: Macrotask queue
10. Run B → **B**
11. Run E → **E**
12. Run G → **G**

**Final:** A, H, C, F, D, B, E, G`,
      code: `function predictOutput() {
  return ['A', 'H', 'C', 'F', 'D', 'B', 'E', 'G'];
}`,
    },
  ],
};
