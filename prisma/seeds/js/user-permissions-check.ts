import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const userPermissionsCheck: SeedQuestion = {
  slug: 'user-permissions-check',
  title: 'User Permissions Check',
  prompt: `You have a list of users (each with a \`permissions\` array) and a list of required permissions. Return only the users who have **all** required permissions.

\`\`\`js
const users = [
  { name: 'Alice', permissions: ['read', 'write', 'delete'] },
  { name: 'Bob', permissions: ['read'] },
  { name: 'Carol', permissions: ['read', 'write'] }
];

usersWithPermissions(users, ['read', 'write'])
// → [
//   { name: 'Alice', permissions: ['read', 'write', 'delete'] },
//   { name: 'Carol', permissions: ['read', 'write'] }
// ]
\`\`\`

**Why this matters:** Permission checks like this show up in every auth system. This tests your ability to combine \`filter\`, \`every\`, and \`includes\`.`,
  description: 'Filter users who have all required permissions using filter + every + includes.',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.EASY,
  accessTier: AccessTier.FREE,
  tags: ['array', 'filter'],
  starterCode: {
    javascript: `function usersWithPermissions(users, required) {
  // Return users who have ALL required permissions
}`,
    typescript: `interface User {
  name: string;
  permissions: string[];
}

function usersWithPermissions(users: User[], required: string[]): User[] {
  // Return users who have ALL required permissions
}`,
  },
  publicTestCode: `test('filters users with all required permissions', () => {
  const users = [
    { name: 'Alice', permissions: ['read', 'write', 'delete'] },
    { name: 'Bob', permissions: ['read'] },
    { name: 'Carol', permissions: ['read', 'write'] }
  ];
  const result = usersWithPermissions(users, ['read', 'write']);
  expect(result).toEqual([
    { name: 'Alice', permissions: ['read', 'write', 'delete'] },
    { name: 'Carol', permissions: ['read', 'write'] }
  ]);
});

test('single required permission', () => {
  const users = [
    { name: 'Alice', permissions: ['read'] },
    { name: 'Bob', permissions: [] }
  ];
  expect(usersWithPermissions(users, ['read'])).toEqual([
    { name: 'Alice', permissions: ['read'] }
  ]);
});`,
  hiddenTestCode: `test('empty required list returns all users', () => {
  const users = [
    { name: 'Alice', permissions: ['read'] },
    { name: 'Bob', permissions: [] }
  ];
  expect(usersWithPermissions(users, [])).toEqual(users);
});

test('no users match', () => {
  const users = [
    { name: 'Alice', permissions: ['read'] },
    { name: 'Bob', permissions: ['write'] }
  ];
  expect(usersWithPermissions(users, ['read', 'write', 'delete'])).toEqual([]);
});

test('empty users list', () => {
  expect(usersWithPermissions([], ['read'])).toEqual([]);
});

test('exact match counts', () => {
  const users = [{ name: 'X', permissions: ['a', 'b'] }];
  expect(usersWithPermissions(users, ['a', 'b'])).toEqual(users);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## filter + every + includes

The key insight is combining three array methods:
- \`filter\` — iterate users, keep those that pass
- \`every\` — check that *all* required permissions are satisfied
- \`includes\` — check if a single permission exists in the user's list

\`\`\`js
users.filter(u => required.every(p => u.permissions.includes(p)))
\`\`\`

This reads almost like English: "filter users where every required permission is included." One-liner, no mutation, O(u × r × p) but fine for auth-sized lists.`,
      code: `function usersWithPermissions(users, required) {
  return users.filter(u => required.every(p => u.permissions.includes(p)));
}`,
    },
  ],
};
