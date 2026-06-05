/**
 * Full re-seed for one or more React questions by slug.
 * Uses the canonical seedQuestion() upsert path so every field
 * (prompt, description, tags, tests, starterCode, solutions, renderData)
 * is brought into line with the seed file.
 *
 * Usage: npx tsx scripts/sync-react-question.ts <slug> [slug2 ...]
 */
import { PrismaClient } from '@prisma/client';
import { seedQuestion } from '../prisma/seeds/seed-questions';
import { paginatedList } from '../prisma/seeds/react/paginated-list';
import { rateLimiterButton } from '../prisma/seeds/react/rate-limiter-button';
import { autocompleteSearch } from '../prisma/seeds/react/autocomplete-search';
import { twoFactorCodeInput } from '../prisma/seeds/react/two-factor-code-input';
import { multiStepForm } from '../prisma/seeds/react/multi-step-form';
import type { SeedQuestion } from '../prisma/seeds/types';

const BY_SLUG: Record<string, SeedQuestion> = {
  'paginated-list': paginatedList,
  'rate-limiter-button': rateLimiterButton,
  'autocomplete-search': autocompleteSearch,
  'two-factor-code-input': twoFactorCodeInput,
  'multi-step-form': multiStepForm,
};

const prisma = new PrismaClient();

async function main() {
  const slugs = process.argv.slice(2);
  if (slugs.length === 0) {
    console.error('Usage: npx tsx scripts/sync-react-question.ts <slug> [slug2 ...]');
    console.error('Known: ' + Object.keys(BY_SLUG).join(', '));
    process.exit(1);
  }

  const demoUser = await prisma.user.findUniqueOrThrow({
    where: { email: 'demo@interview.dev' },
  });

  for (const slug of slugs) {
    const seed = BY_SLUG[slug];
    if (!seed) {
      console.error(`Unknown slug: ${slug}`);
      continue;
    }
    await seedQuestion(prisma, seed, demoUser.id);
    console.log(`✓ synced ${slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
