/**
 * Seed (or update) a single question by slug.
 *
 * Usage:
 *   npx tsx prisma/seed-one.ts two-sum
 *   npx tsx prisma/seed-one.ts --reset two-sum     # also clears user drafts
 */
import { PrismaClient } from '@prisma/client';
import { seedQuestion } from './seeds';
import * as allSeeds from './seeds';
import type { SeedQuestion } from './seeds';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const reset = args.includes('--reset');
  const slug = args.find((a) => !a.startsWith('--'));

  if (!slug) {
    const available = Object.values(allSeeds)
      .filter((v): v is SeedQuestion => typeof v === 'object' && v !== null && 'slug' in v)
      .map((q) => q.slug);
    console.error('Usage: npx tsx prisma/seed-one.ts [--reset] <slug>\n');
    console.error('  --reset  Clear all user code drafts for this question\n');
    console.error('Available questions:');
    available.forEach((s) => console.error(`  ${s}`));
    process.exit(1);
  }

  const question = Object.values(allSeeds)
    .filter((v): v is SeedQuestion => typeof v === 'object' && v !== null && 'slug' in v)
    .find((q) => q.slug === slug);

  if (!question) {
    console.error(`No seed found for slug "${slug}"`);
    process.exit(1);
  }

  const adminUser = await prisma.user.findFirst({
    where: { userRoles: { some: { role: { key: 'ADMIN' } } } },
  });

  if (!adminUser) {
    console.error('No admin user found. Run full seed first: npx tsx prisma/seed.ts');
    process.exit(1);
  }

  console.log(`Seeding "${question.title}" (${slug})...`);
  const record = await seedQuestion(prisma, question, adminUser.id);

  if (reset) {
    const { count } = await prisma.codeDraft.deleteMany({
      where: { questionId: record.id },
    });
    console.log(`Cleared ${count} code draft(s).`);
  }

  console.log(`Done. Question ID: ${record.id}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
