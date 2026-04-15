/**
 * Export critical application data as JSON files.
 * Run with: npx tsx prisma/backup-data.ts
 *
 * Outputs to: backups/<timestamp>/
 * - users.json          (users + profiles + roles)
 * - questions.json      (questions + tags + versions + solutions)
 * - billing.json        (subscriptions, purchases, entitlements, plans, packs)
 * - submissions.json    (submission history — can be large, exported separately)
 */
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../lib/db/prisma';

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dir = path.join(__dirname, '..', 'backups', timestamp);
  fs.mkdirSync(dir, { recursive: true });

  console.log(`Backing up to ${dir}/\n`);

  // ── Users + profiles + roles ──
  const users = await prisma.user.findMany({
    include: {
      profile: true,
      userRoles: { include: { role: true } },
    },
  });
  write(dir, 'users.json', users);
  console.log(`  ✓ users.json (${users.length} users)`);

  // ── Questions + all related content ──
  const questions = await prisma.question.findMany({
    include: {
      tags: { include: { tag: true } },
      versions: { orderBy: { version: 'desc' } },
      officialSolutions: true,
      packLinks: true,
    },
  });
  write(dir, 'questions.json', questions);
  console.log(`  ✓ questions.json (${questions.length} questions)`);

  // ── Billing: plans, packs, subscriptions, purchases, entitlements ──
  const [plans, packs, subscriptions, purchases, entitlements] = await Promise.all([
    prisma.subscriptionPlan.findMany(),
    prisma.contentPack.findMany({ include: { links: true } }),
    prisma.subscription.findMany({ include: { events: true } }),
    prisma.packPurchase.findMany(),
    prisma.entitlement.findMany(),
  ]);
  write(dir, 'billing.json', { plans, packs, subscriptions, purchases, entitlements });
  console.log(`  ✓ billing.json (${subscriptions.length} subs, ${purchases.length} purchases, ${entitlements.length} entitlements)`);

  // ── Submissions (can grow large — separate file) ──
  const submissions = await prisma.submission.findMany({
    include: { results: true },
  });
  write(dir, 'submissions.json', submissions);
  console.log(`  ✓ submissions.json (${submissions.length} submissions)`);

  console.log(`\nDone. Backup saved to ${dir}/`);
}

function write(dir: string, filename: string, data: unknown) {
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(data, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
