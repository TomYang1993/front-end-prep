/**
 * Utility script to verify the contents of the database.
 * 
 * We created this script while debugging an issue where the React UI 
 * didn't show the correct TypeScript starter code for a seeded question.
 * The issue turned out to be that Prisma's `upsert` block quietly dropped
 * updates due to an empty `update: {}` block in `seed.ts`. 
 * 
 * We use this script to run direct queries against the Prisma client
 * via `npm run tsx scripts/check-db.ts` to guarantee that the database 
 * actually has the expected nested JSON fields.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const version = await prisma.questionVersion.findFirst({
    where: { question: { slug: 'use-previous-hook' } }
  });
  
  console.log('--- DB RESULT ---');
  console.log(JSON.stringify(version?.starterCode, null, 2));
  console.log('-----------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
