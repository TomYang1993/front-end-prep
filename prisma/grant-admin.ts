import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx tsx prisma/grant-admin.ts <email>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email ${email}. Sign in once first.`);
    process.exit(1);
  }

  const role = await prisma.role.upsert({
    where: { key: 'ADMIN' },
    update: {},
    create: { key: 'ADMIN', name: 'Admin' },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });

  console.log(`Granted ADMIN to ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
