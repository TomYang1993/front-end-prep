import { PrismaClient } from '@prisma/client';
import { multiStepForm } from '../prisma/seeds/react/multi-step-form';

const p = new PrismaClient();

async function main() {
  const q = await p.question.findUnique({
    where: { slug: 'multi-step-form' },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  });
  const db = q!.versions[0].starterCode as Record<string, string>;
  const seed = multiStepForm.starterCode as Record<string, string>;
  for (const k of ['react', 'reactTypescript', 'css']) {
    if (db[k] !== seed[k]) {
      console.log('===', k, '===');
      console.log('DB length:', db[k]?.length, 'Seed length:', seed[k]?.length);
      console.log('--- DB ---');
      console.log(db[k]);
      console.log('--- SEED ---');
      console.log(seed[k]);
    } else {
      console.log('==', k, 'identical ==');
    }
  }
}

main().finally(() => p.$disconnect());
