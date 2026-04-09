import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { badRequest, unauthorized, forbidden } from '@/lib/api';
import { requireAdmin } from '@/lib/auth/current-user';
import { createAuditLog } from '@/lib/audit';
import { refreshQuestionRenderData } from '@/lib/questions-snapshot';

const testSchema = z.object({
  visibility: z.enum(['PUBLIC', 'HIDDEN']),
  input: z.unknown(),
  expected: z.unknown(),
  explanation: z.string().optional(),
  sortOrder: z.number().int().nonnegative()
});

const bodySchema = z.object({
  slug: z.string().min(3),
  title: z.string().min(3),
  prompt: z.string().min(10),
  type: z.enum(['FUNCTION_JS', 'REACT_APP', 'FUNCTION_PYTHON']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  accessTier: z.enum(['FREE', 'PREMIUM']),
  isPublished: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  content: z.record(z.unknown()).default({}),
  starterCode: z.record(z.string()).default({}),
  testCases: z.array(testSchema).default([])
});

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req).catch((error) => {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return 'FORBIDDEN' as const;
    }
    return null;
  });

  if (admin === 'FORBIDDEN') {
    return forbidden();
  }

  if (!admin) {
    return unauthorized();
  }
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message || 'Invalid question payload');
  }

  const data = parsed.data;
  const tagIds = await Promise.all(
    data.tags.map(async (name) => {
      const tag = await prisma.questionTag.upsert({
        where: { name },
        update: {},
        create: { name }
      });
      return tag.id;
    })
  );

  const existing = await prisma.question.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return badRequest('Question slug already exists', 'DUPLICATE_SLUG');
  }

  const question = await prisma.question.create({
    data: {
      slug: data.slug,
      title: data.title,
      prompt: data.prompt,
      type: data.type,
      difficulty: data.difficulty,
      accessTier: data.accessTier,
      isPublished: data.isPublished,
      createdById: admin.id,
      versions: {
        create: {
          version: 1,
          content: data.content as Prisma.InputJsonValue,
          starterCode: data.starterCode as Prisma.InputJsonValue,
          status: data.isPublished ? 'PUBLISHED' : 'DRAFT',
          publishedAt: data.isPublished ? new Date() : null
        }
      },
      testCases: {
        create: data.testCases.map((testCase) => ({
          visibility: testCase.visibility,
          input: testCase.input as Prisma.InputJsonValue,
          expected: testCase.expected as Prisma.InputJsonValue,
          explanation: testCase.explanation,
          sortOrder: testCase.sortOrder
        }))
      },
      tags: {
        create: tagIds.map((tagId) => ({ tagId }))
      }
    },
    include: {
      tags: { include: { tag: true } },
      versions: true,
      testCases: true
    }
  });

  await Promise.all([
    refreshQuestionRenderData(question.id),
    createAuditLog({
      actorId: admin.id,
      action: 'admin.question.create',
      entityType: 'Question',
      entityId: question.id,
      payload: { slug: question.slug }
    }),
  ]);

  return NextResponse.json({ question }, { status: 201 });
}
