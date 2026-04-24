import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const shoppingCartTotal: SeedQuestion = {
  slug: 'shopping-cart-total',
  title: 'Shopping Cart Total with Discounts',
  prompt: `Given an array of cart items, calculate the total price. Items with a unit price over $100 get **10% off** their line total. Also return whether **free shipping** applies (total \u2265 $50).

\`\`\`js
const cart = [
  { name: 'Shirt', price: 30, quantity: 2 },   // 60
  { name: 'Jacket', price: 120, quantity: 1 },  // 120 * 0.9 = 108
  { name: 'Socks', price: 8, quantity: 3 }      // 24
];

cartTotal(cart)
// \u2192 { total: 192, freeShipping: true }
\`\`\`

**Rules:**
- The discount applies per item based on its \`price\` (unit price), not the line total.
- Return an object with \`total\` (number) and \`freeShipping\` (boolean).

**Why this matters:** E-commerce price calculation is the canonical \`reduce\` use case.`,
  description: 'Calculate cart total with conditional discounts using reduce and ternary logic.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.EASY,
  accessTier: AccessTier.FREE,
  tags: ['array', 'reduce'],
  starterCode: {
    javascript: `function cartTotal(cart) {
  // Return { total, freeShipping }
}`,
    typescript: `interface CartItem {
  name: string;
  price: number;
  quantity: number;
}

function cartTotal(cart: CartItem[]): { total: number; freeShipping: boolean } {
  // Return { total, freeShipping }
}`,
  },
  publicTestCode: `test('applies discount to items over $100 and checks free shipping', () => {
  const cart = [
    { name: 'Shirt', price: 30, quantity: 2 },
    { name: 'Jacket', price: 120, quantity: 1 },
    { name: 'Socks', price: 8, quantity: 3 }
  ];
  expect(cartTotal(cart)).toEqual({ total: 192, freeShipping: true });
});

test('no discounts when all items under $100', () => {
  const cart = [
    { name: 'Book', price: 15, quantity: 1 },
    { name: 'Pen', price: 3, quantity: 2 }
  ];
  expect(cartTotal(cart)).toEqual({ total: 21, freeShipping: false });
});`,
  hiddenTestCode: `test('empty cart', () => {
  expect(cartTotal([])).toEqual({ total: 0, freeShipping: false });
});

test('single expensive item', () => {
  const cart = [{ name: 'TV', price: 500, quantity: 1 }];
  expect(cartTotal(cart)).toEqual({ total: 450, freeShipping: true });
});

test('exactly $100 item gets no discount', () => {
  const cart = [{ name: 'Shoes', price: 100, quantity: 1 }];
  expect(cartTotal(cart)).toEqual({ total: 100, freeShipping: true });
});

test('exactly $50 total qualifies for free shipping', () => {
  const cart = [{ name: 'Hat', price: 50, quantity: 1 }];
  expect(cartTotal(cart)).toEqual({ total: 50, freeShipping: true });
});

test('multiple expensive items', () => {
  const cart = [
    { name: 'Laptop', price: 200, quantity: 2 },
    { name: 'Monitor', price: 150, quantity: 1 }
  ];
  // 200*2*0.9 = 360, 150*1*0.9 = 135 => 495
  expect(cartTotal(cart)).toEqual({ total: 495, freeShipping: true });
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## reduce with conditional discount

Walk through each item with \`reduce\`:
1. Compute the line total: \`price * quantity\`
2. If the unit \`price > 100\`, apply 10% discount (\`* 0.9\`)
3. Accumulate into a running sum
4. After the loop, check if the total qualifies for free shipping (\`>= 50\`)

The ternary inside the reducer is the key decision point — it tests whether candidates can embed branching logic inside a reduce callback cleanly.`,
      code: `function cartTotal(cart) {
  const total = cart.reduce((sum, item) => {
    const lineTotal = item.price * item.quantity;
    const discounted = item.price > 100 ? lineTotal * 0.9 : lineTotal;
    return sum + discounted;
  }, 0);
  return { total, freeShipping: total >= 50 };
}`,
    },
  ],
};
