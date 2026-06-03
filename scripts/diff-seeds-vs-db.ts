/**
 * Diff seed source vs DB state to find admin-edited questions.
 *
 * Compares every field the admin UI can mutate (Question + latest
 * QuestionVersion + tags + OfficialSolutions) and prints a per-question
 * report of drift.
 *
 * Usage: npx tsx scripts/diff-seeds-vs-db.ts
 */
import { PrismaClient } from '@prisma/client';
import * as seeds from '../prisma/seeds';
import type { SeedQuestion } from '../prisma/seeds';

const prisma = new PrismaClient();

type Diff = { field: string; seed: unknown; db: unknown };

function collectSeeds(): SeedQuestion[] {
  const result: SeedQuestion[] = [];
  for (const value of Object.values(seeds)) {
    if (value && typeof value === 'object' && 'slug' in value && 'prompt' in value) {
      result.push(value as SeedQuestion);
    }
  }
  return result;
}

function preview(v: unknown): string {
  if (v === null || v === undefined) return String(v);
  if (typeof v === 'string') {
    const s = v.replace(/\s+/g, ' ').trim();
    return s.length > 80 ? `${s.slice(0, 77)}…` : s;
  }
  const s = JSON.stringify(v);
  return s.length > 120 ? `${s.slice(0, 117)}…` : s;
}

function jsonEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function normalizeTags(arr: string[]): string[] {
  return [...arr].sort();
}

async function diffOne(seed: SeedQuestion): Promise<Diff[]> {
  const q = await prisma.question.findUnique({
    where: { slug: seed.slug },
    include: {
      tags: { include: { tag: true } },
      versions: { orderBy: { version: 'desc' }, take: 1 },
      officialSolutions: true,
    },
  });

  if (!q) return [{ field: '<missing in DB>', seed: seed.slug, db: null }];

  const diffs: Diff[] = [];
  const scalar: Array<keyof SeedQuestion & keyof typeof q> = [
    'title',
    'prompt',
    'type',
    'difficulty',
    'accessTier',
    'timeLimitMinutes',
    'publicTestCode',
    'hiddenTestCode',
    'language',
    'functionName',
  ];
  for (const f of scalar) {
    const sv = seed[f] ?? null;
    const dv = (q as Record<string, unknown>)[f] ?? null;
    if (!jsonEqual(sv, dv)) diffs.push({ field: f, seed: sv, db: dv });
  }

  // JSON test cases
  for (const f of ['publicTestCases', 'hiddenTestCases'] as const) {
    const sv = seed[f] ?? null;
    const dv = (q as Record<string, unknown>)[f] ?? null;
    if (!jsonEqual(sv, dv)) diffs.push({ field: f, seed: sv, db: dv });
  }

  // Tags
  const seedTags = normalizeTags(seed.tags);
  const dbTags = normalizeTags(q.tags.map((t) => t.tag.name));
  if (!jsonEqual(seedTags, dbTags)) {
    diffs.push({ field: 'tags', seed: seedTags, db: dbTags });
  }

  // Latest version: description + starterCode
  const v = q.versions[0];
  if (v) {
    const dbDescription = (v.content as { description?: string } | null)?.description ?? null;
    if (!jsonEqual(seed.description, dbDescription)) {
      diffs.push({ field: 'description', seed: seed.description, db: dbDescription });
    }
    if (!jsonEqual(seed.starterCode, v.starterCode)) {
      diffs.push({ field: 'starterCode', seed: seed.starterCode, db: v.starterCode });
    }
  }

  // Solutions — match by language
  const seedSols = seed.solutions ?? [];
  for (const ss of seedSols) {
    const ds = q.officialSolutions.find((s) => s.language === ss.language);
    if (!ds) {
      diffs.push({ field: `solution[${ss.language}]`, seed: '<present>', db: '<missing>' });
      continue;
    }
    if (!jsonEqual(ss.code, ds.code)) {
      diffs.push({ field: `solution[${ss.language}].code`, seed: ss.code, db: ds.code });
    }
    if (!jsonEqual(ss.explanation, ds.explanation)) {
      diffs.push({ field: `solution[${ss.language}].explanation`, seed: ss.explanation, db: ds.explanation });
    }
    if (!jsonEqual(ss.complexity ?? null, ds.complexity ?? null)) {
      diffs.push({ field: `solution[${ss.language}].complexity`, seed: ss.complexity, db: ds.complexity });
    }
  }
  // Extra DB solutions not in seed
  for (const ds of q.officialSolutions) {
    if (!seedSols.find((ss) => ss.language === ds.language)) {
      diffs.push({ field: `solution[${ds.language}]`, seed: '<missing>', db: '<present in DB>' });
    }
  }

  return diffs;
}

async function main() {
  const list = collectSeeds();
  console.log(`Comparing ${list.length} seeds against DB...\n`);

  let driftCount = 0;
  for (const seed of list) {
    const diffs = await diffOne(seed);
    if (diffs.length === 0) continue;
    driftCount++;
    console.log(`\n━━━ ${seed.slug} (${diffs.length} diff${diffs.length === 1 ? '' : 's'}) ━━━`);
    for (const d of diffs) {
      console.log(`  • ${d.field}`);
      console.log(`      seed: ${preview(d.seed)}`);
      console.log(`      db  : ${preview(d.db)}`);
    }
  }

  console.log(`\n\n${driftCount} question(s) have drift between seed and DB.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
