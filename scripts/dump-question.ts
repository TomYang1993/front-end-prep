/**
 * Dump full DB state for a question by slug as JSON.
 * Usage: npx tsx scripts/dump-question.ts <slug> [slug2 ...]
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function dump(slug: string) {
  const q = await prisma.question.findUnique({
    where: { slug },
    include: {
      tags: { include: { tag: true } },
      versions: { orderBy: { version: 'desc' }, take: 1 },
      officialSolutions: true,
    },
  });
  if (!q) {
    console.error(`Not found: ${slug}`);
    return;
  }
  const v = q.versions[0];
  const out = {
    slug: q.slug,
    title: q.title,
    prompt: q.prompt,
    type: q.type,
    difficulty: q.difficulty,
    accessTier: q.accessTier,
    timeLimitMinutes: q.timeLimitMinutes,
    isPublished: q.isPublished,
    publicTestCode: q.publicTestCode,
    hiddenTestCode: q.hiddenTestCode,
    language: q.language,
    functionName: q.functionName,
    publicTestCases: q.publicTestCases,
    hiddenTestCases: q.hiddenTestCases,
    tags: q.tags.map((t) => t.tag.name).sort(),
    description: (v?.content as { description?: string } | null)?.description ?? null,
    starterCode: v?.starterCode ?? null,
    solutions: q.officialSolutions.map((s) => ({
      language: s.language,
      code: s.code,
      explanation: s.explanation,
      complexity: s.complexity,
    })),
  };
  console.log(JSON.stringify(out, null, 2));
}

async function main() {
  const slugs = process.argv.slice(2);
  if (!slugs.length) {
    console.error('Usage: npx tsx scripts/dump-question.ts <slug> [slug2 ...]');
    process.exit(1);
  }
  for (const slug of slugs) {
    console.log(`\n===== ${slug} =====`);
    await dump(slug);
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
