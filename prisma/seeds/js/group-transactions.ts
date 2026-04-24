import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const groupTransactions: SeedQuestion = {
  slug: 'group-transactions',
  title: 'Group Transactions by Category',
  prompt: `Given an array of bank transactions, group them by \`category\` and sum the amounts.

\`\`\`js
const transactions = [
  { category: 'food', amount: 12 },
  { category: 'transport', amount: 25 },
  { category: 'food', amount: 40 },
  { category: 'entertainment', amount: 15 },
  { category: 'food', amount: 8 }
];

groupByCategory(transactions)
// \u2192 { food: 60, transport: 25, entertainment: 15 }
\`\`\`

**Why this matters:** Expense trackers, analytics dashboards, any aggregation view \u2014 "group by and sum" is one of the most common data transformations.`,
  description: 'Group transactions by category and sum amounts using reduce.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.EASY,
  accessTier: AccessTier.FREE,
  tags: ['array', 'reduce'],
  starterCode: {
    javascript: `function groupByCategory(transactions) {
  // Return an object mapping category -> total amount
}`,
    typescript: `interface Transaction {
  category: string;
  amount: number;
}

function groupByCategory(transactions: Transaction[]): Record<string, number> {
  // Return an object mapping category -> total amount
}`,
  },
  publicTestCode: `test('groups and sums transactions', () => {
  const transactions = [
    { category: 'food', amount: 12 },
    { category: 'transport', amount: 25 },
    { category: 'food', amount: 40 },
    { category: 'entertainment', amount: 15 },
    { category: 'food', amount: 8 }
  ];
  expect(groupByCategory(transactions)).toEqual({
    food: 60,
    transport: 25,
    entertainment: 15
  });
});

test('single category', () => {
  const transactions = [
    { category: 'rent', amount: 1000 },
    { category: 'rent', amount: 200 }
  ];
  expect(groupByCategory(transactions)).toEqual({ rent: 1200 });
});`,
  hiddenTestCode: `test('empty transactions', () => {
  expect(groupByCategory([])).toEqual({});
});

test('single transaction', () => {
  expect(groupByCategory([{ category: 'misc', amount: 5 }])).toEqual({ misc: 5 });
});

test('all unique categories', () => {
  const transactions = [
    { category: 'a', amount: 1 },
    { category: 'b', amount: 2 },
    { category: 'c', amount: 3 }
  ];
  expect(groupByCategory(transactions)).toEqual({ a: 1, b: 2, c: 3 });
});

test('handles decimal amounts', () => {
  const transactions = [
    { category: 'food', amount: 12.5 },
    { category: 'food', amount: 7.5 }
  ];
  expect(groupByCategory(transactions)).toEqual({ food: 20 });
});

test('handles zero amounts', () => {
  const transactions = [
    { category: 'refund', amount: 0 },
    { category: 'refund', amount: 50 }
  ];
  expect(groupByCategory(transactions)).toEqual({ refund: 50 });
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## reduce with object accumulator

The classic "group by" pattern:
1. Start with an empty object \`{}\`
2. For each transaction, add its amount to the running total for its category
3. Use \`|| 0\` to initialize a category the first time it's seen

\`\`\`js
acc[t.category] = (acc[t.category] || 0) + t.amount;
\`\`\`

This is the JS equivalent of SQL's \`GROUP BY category SUM(amount)\`. Also solvable with a \`for...of\` loop — equally valid, \`reduce\` is just more idiomatic for accumulating into a new shape.`,
      code: `function groupByCategory(transactions) {
  return transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
}`,
    },
  ],
};
