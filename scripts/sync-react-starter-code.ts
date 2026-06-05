/**
 * Sync starterCode JSON from seed → DB for every React question.
 *
 * Source of truth: prisma/seeds/react/*. Updates the latest QuestionVersion's
 * starterCode by full replacement (not merge) so DB-only keys are dropped.
 *
 * Usage:
 *   npx tsx scripts/sync-react-starter-code.ts          # dry run, print diffs
 *   npx tsx scripts/sync-react-starter-code.ts --apply  # write to DB
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { paginatedList } from '../prisma/seeds/react/paginated-list';
import { rateLimiterButton } from '../prisma/seeds/react/rate-limiter-button';
import { autocompleteSearch } from '../prisma/seeds/react/autocomplete-search';
import { twoFactorCodeInput } from '../prisma/seeds/react/two-factor-code-input';
import { multiStepForm } from '../prisma/seeds/react/multi-step-form';
import type { SeedQuestion } from '../prisma/seeds/types';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

const REACT_SEEDS: SeedQuestion[] = [
  paginatedList,
  rateLimiterButton,
  autocompleteSearch,
  twoFactorCodeInput,
  multiStepForm,
];

function keys(obj: Record<string, unknown> | null | undefined): string[] {
  return obj ? Object.keys(obj).sort() : [];
}

async function syncOne(seed: SeedQuestion) {
  const q = await prisma.question.findUnique({
    where: { slug: seed.slug },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  });
  if (!q) {
    console.warn(`[skip] ${seed.slug} not in DB`);
    return;
  }
  const latest = q.versions[0];
  if (!latest) {
    console.warn(`[skip] ${seed.slug} has no QuestionVersion`);
    return;
  }

  const dbStarter = (latest.starterCode ?? {}) as Record<string, string>;
  const seedStarter = seed.starterCode;
  const dbKeys = keys(dbStarter);
  const seedKeys = keys(seedStarter);
  const sameKeys = JSON.stringify(dbKeys) === JSON.stringify(seedKeys);
  const sameValues = JSON.stringify(dbStarter) === JSON.stringify(seedStarter);

  if (sameKeys && sameValues) {
    console.log(`[ok]   ${seed.slug} — already in sync (${seedKeys.join(', ')})`);
    return;
  }

  console.log(`[diff] ${seed.slug}`);
  console.log(`       db keys  : ${dbKeys.join(', ') || '<none>'}`);
  console.log(`       seed keys: ${seedKeys.join(', ')}`);
  if (sameKeys && !sameValues) console.log(`       (keys match, values differ)`);

  if (!APPLY) return;

  await prisma.questionVersion.update({
    where: { id: latest.id },
    data: { starterCode: seedStarter as Prisma.InputJsonValue },
  });
  console.log(`       → updated version ${latest.id}`);
}

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY (writing to DB)' : 'DRY RUN (no writes)'}`);
  console.log(`Syncing ${REACT_SEEDS.length} React seeds...\n`);
  for (const seed of REACT_SEEDS) {
    await syncOne(seed);
  }
  if (!APPLY) console.log(`\nRe-run with --apply to write changes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
