import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const formValidation: SeedQuestion = {
  slug: 'form-validation',
  title: 'Form Validation',
  prompt: `Given a form object, validate it against a set of rules and return an array of error messages. Return an empty array if the form is valid.

\`\`\`js
const form = {
  email: 'alice@',
  password: '123',
  age: 15
};

validateForm(form)
// \u2192 [
//   'Invalid email',
//   'Password must be at least 8 characters',
//   'Must be 18 or older'
// ]
\`\`\`

**Validation rules:**
1. \`email\` must contain both \`@\` and \`.'\` \u2192 error: \`'Invalid email'\`
2. \`password\` must be at least 8 characters \u2192 error: \`'Password must be at least 8 characters'\`
3. \`age\` must be 18 or older \u2192 error: \`'Must be 18 or older'\`

**Hint:** Think data-driven \u2014 define rules as an array of objects with a \`check\` function and \`message\`, then filter for failing rules.

**Why this matters:** Every form validation library uses some version of this pattern. Tests whether you can think in terms of data-driven code instead of a big if/else block.`,
  description: 'Validate form fields using a data-driven rule array with filter and map.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.EASY,
  accessTier: AccessTier.FREE,
  tags: ['array', 'validation'],
  starterCode: {
    javascript: `function validateForm(form) {
  // Return array of error messages (empty if valid)
}`,
    typescript: `interface FormData {
  email: string;
  password: string;
  age: number;
}

function validateForm(form: FormData): string[] {
  // Return array of error messages (empty if valid)
}`,
  },
  publicTestCode: `test('returns all errors for invalid form', () => {
  const form = { email: 'alice@', password: '123', age: 15 };
  expect(validateForm(form)).toEqual([
    'Invalid email',
    'Password must be at least 8 characters',
    'Must be 18 or older'
  ]);
});

test('returns empty array for valid form', () => {
  const form = { email: 'alice@example.com', password: 'securepass', age: 25 };
  expect(validateForm(form)).toEqual([]);
});`,
  hiddenTestCode: `test('only email invalid', () => {
  const form = { email: 'bad', password: 'longpassword', age: 21 };
  expect(validateForm(form)).toEqual(['Invalid email']);
});

test('only password invalid', () => {
  const form = { email: 'a@b.com', password: 'short', age: 30 };
  expect(validateForm(form)).toEqual(['Password must be at least 8 characters']);
});

test('only age invalid', () => {
  const form = { email: 'a@b.com', password: '12345678', age: 17 };
  expect(validateForm(form)).toEqual(['Must be 18 or older']);
});

test('exactly 18 is valid', () => {
  const form = { email: 'a@b.com', password: '12345678', age: 18 };
  expect(validateForm(form)).toEqual([]);
});

test('exactly 8 char password is valid', () => {
  const form = { email: 'a@b.com', password: 'abcdefgh', age: 20 };
  expect(validateForm(form)).toEqual([]);
});

test('email with @ but no dot is invalid', () => {
  const form = { email: 'a@bcom', password: '12345678', age: 20 };
  expect(validateForm(form)).toEqual(['Invalid email']);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## Data-driven validation

Instead of a chain of if/else statements, define rules as data:

\`\`\`js
const rules = [
  { check: f => ..., message: '...' },
  ...
];
\`\`\`

Then filter for rules that *fail* and map to their messages. This pattern is:
- **Extensible** — add a rule = add an object, no control flow changes
- **Testable** — each rule is independent
- **Composable** — reuse rule sets across forms

This is how libraries like Yup, Zod, and React Hook Form work under the hood.`,
      code: `function validateForm(form) {
  const rules = [
    { check: f => f.email.includes('@') && f.email.includes('.'), message: 'Invalid email' },
    { check: f => f.password.length >= 8, message: 'Password must be at least 8 characters' },
    { check: f => f.age >= 18, message: 'Must be 18 or older' }
  ];
  return rules.filter(r => !r.check(form)).map(r => r.message);
}`,
    },
  ],
};
