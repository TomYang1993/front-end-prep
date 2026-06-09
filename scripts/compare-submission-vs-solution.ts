/**
 * Compare latest PASSED React submission per question vs DB OfficialSolution
 * and seed SOLUTION_CODE/SOLUTION_CSS. Submissions store JSON {app, styles}.
 *
 * Usage: npx tsx scripts/compare-submission-vs-solution.ts [userEmail]
 *   defaults to ycghost123@gmail.com
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'node:fs';
import * as path from 'node:path';

const prisma = new PrismaClient();

const REACT_SLUGS = [
  'autocomplete-search',
  'multi-step-form',
  'paginated-list',
  'rate-limiter-button',
  'two-factor-code-input',
];

function readTaggedConst(src: string, name: string): string | null {
  const re = new RegExp(`const\\s+${name}\\s*=\\s*\`([\\s\\S]*?)\`;\\s*\\n`);
  const m = src.match(re);
  return m ? m[1] : null;
}

function readSeed(slug: string): { sol: string | null; solCss: string | null; starterCss: string | null } {
  const file = path.join(__dirname, '..', 'prisma', 'seeds', 'react', `${slug}.ts`);
  if (!fs.existsSync(file)) return { sol: null, solCss: null, starterCss: null };
  const src = fs.readFileSync(file, 'utf8');
  return {
    sol: readTaggedConst(src, 'SOLUTION_CODE'),
    solCss: readTaggedConst(src, 'SOLUTION_CSS'),
    starterCss: readTaggedConst(src, 'STARTER_CSS'),
  };
}

function normalize(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trimEnd();
}

function lineDiff(a: string, b: string): { rem: number; add: number; sample: string[] } {
  const aLines = a.split('\n');
  const bLines = b.split('\n');
  const aSet = new Set(aLines);
  const bSet = new Set(bLines);
  const removed = aLines.filter((l) => !bSet.has(l) && l.trim());
  const added = bLines.filter((l) => !aSet.has(l) && l.trim());
  const sample = [
    ...removed.slice(0, 8).map((l) => `- ${l}`),
    ...added.slice(0, 8).map((l) => `+ ${l}`),
  ];
  return { rem: removed.length, add: added.length, sample };
}

function report(label: string, a: string, b: string) {
  if (a === b) {
    console.log(`  ${label}: IDENTICAL`);
    return;
  }
  const d = lineDiff(a, b);
  console.log(`  ${label}: DRIFT  (-${d.rem}/+${d.add} non-blank line keys)`);
  d.sample.forEach((l) => console.log(`      ${l}`));
}

async function main() {
  const email = process.argv[2] || 'ycghost123@gmail.com';
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }
  console.log(`User: ${email} (${user.id})\n`);

  for (const slug of REACT_SLUGS) {
    console.log(`===== ${slug} =====`);
    const q = await prisma.question.findUnique({
      where: { slug },
      include: { officialSolutions: true },
    });
    if (!q) { console.log('  NOT FOUND IN DB\n'); continue; }

    const sub = await prisma.submission.findFirst({
      where: { userId: user.id, questionId: q.id, status: 'PASSED' },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub) { console.log('  no PASSED submission\n'); continue; }
    console.log(`  submission: ${sub.id}  score=${sub.score}  at=${sub.createdAt.toISOString()}`);

    let subApp = ''; let subStyles = '';
    try {
      const j = JSON.parse(sub.code);
      subApp = normalize(j.app);
      subStyles = normalize(j.styles);
    } catch {
      subApp = normalize(sub.code);
    }

    const dbSol = q.officialSolutions[0];
    const dbCode = normalize(dbSol?.code);
    const seed = readSeed(slug);
    const seedSol = normalize(seed.sol);
    const seedSolCss = normalize(seed.solCss);
    const seedStarterCss = normalize(seed.starterCss);

    console.log(`  sizes: sub.app=${subApp.length}  sub.styles=${subStyles.length}  db.sol=${dbCode.length}  seed.sol=${seedSol.length}  seed.solCss=${seedSolCss.length}  seed.starterCss=${seedStarterCss.length}`);

    // 1) DB vs seed (catch divergence in canonical solution)
    report('db.sol vs seed.sol', dbCode, seedSol);

    // 2) Submission app vs DB solution
    report('sub.app vs db.sol', subApp, dbCode);

    // 3) Submission app vs seed solution
    report('sub.app vs seed.sol', subApp, seedSol);

    // 4) Styles comparison (compare submission.styles to seed.SOLUTION_CSS if present, else STARTER_CSS)
    const cssReference = seedSolCss || seedStarterCss;
    if (cssReference) {
      report('sub.styles vs seed.css', subStyles, cssReference);
    } else {
      console.log(`  sub.styles vs seed.css: SKIP (no css constant in seed)`);
    }

    console.log();
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
