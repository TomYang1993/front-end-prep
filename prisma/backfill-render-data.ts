/**
 * One-time backfill: compute renderData for all published questions.
 * Run with: npx tsx prisma/backfill-render-data.ts
 */
import { prisma } from '../lib/db/prisma';
import { refreshQuestionRenderData } from '../lib/questions-snapshot';

async function main() {
  const questions = await prisma.question.findMany({
    where: { isPublished: true },
    select: { id: true, slug: true },
  });

  console.log(`Backfilling renderData for ${questions.length} published questions…`);

  for (const q of questions) {
    await refreshQuestionRenderData(q.id);
    console.log(`  ✓ ${q.slug}`);
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
