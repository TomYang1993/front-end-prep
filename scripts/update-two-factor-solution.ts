/**
 * One-shot: sync OfficialSolution + latest QuestionVersion.starterCode for
 * two-factor-code-input with seed file.
 * Usage: npx tsx scripts/update-two-factor-solution.ts
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { twoFactorCodeInput } from '../prisma/seeds/react/two-factor-code-input';

const prisma = new PrismaClient();

async function main() {
  const slug = twoFactorCodeInput.slug;
  const seedSol = twoFactorCodeInput.solutions[0];

  const q = await prisma.question.findUnique({
    where: { slug },
    include: {
      officialSolutions: true,
      versions: { orderBy: { version: 'desc' }, take: 1 },
    },
  });
  if (!q) throw new Error(`Question not found: ${slug}`);

  const existing = q.officialSolutions.find((s) => s.language === seedSol.language);
  if (!existing) {
    await prisma.officialSolution.create({
      data: {
        questionId: q.id,
        language: seedSol.language,
        code: seedSol.code,
        explanation: seedSol.explanation,
        complexity: seedSol.complexity ?? null,
      },
    });
    console.log(`Created solution (${seedSol.language})`);
  } else {
    await prisma.officialSolution.update({
      where: { id: existing.id },
      data: {
        code: seedSol.code,
        explanation: seedSol.explanation,
        complexity: seedSol.complexity ?? null,
      },
    });
    console.log(`Updated solution ${existing.id} (${seedSol.language})`);
  }

  const latest = q.versions[0];
  if (!latest) {
    console.warn('No QuestionVersion found; skipping starterCode update');
  } else {
    const current = (latest.starterCode ?? {}) as Record<string, string>;
    const merged: Record<string, string> = {
      ...current,
      ...twoFactorCodeInput.starterCode,
    };
    await prisma.questionVersion.update({
      where: { id: latest.id },
      data: { starterCode: merged as Prisma.InputJsonValue },
    });
    console.log(
      `Updated version ${latest.id} starterCode keys: ${Object.keys(merged).join(', ')}`,
    );
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
