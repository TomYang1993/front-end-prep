import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SLUGS = ['infinite-scroll-list', 'virtual-list'];

async function main() {
  const result = await prisma.question.updateMany({
    where: { slug: { in: SLUGS } },
    data: { isPublished: false },
  });

  console.log(`Unpublished ${result.count} question(s):`, SLUGS);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
