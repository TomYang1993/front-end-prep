import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authorizeAdmin } from '@/lib/auth/current-user';
import { badRequest, notFound } from '@/lib/api';
import { refreshQuestionRenderData } from '@/lib/questions-snapshot';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const admin = await authorizeAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      versions: { orderBy: { version: 'desc' } },
      officialSolutions: { orderBy: { updatedAt: 'desc' } }
    }
  });

  if (!question) {
    return notFound('Question not found');
  }

  return NextResponse.json({ question });
}

const patchSchema = z.object({
  slug: z.string().min(3).optional(),
  title: z.string().min(3).optional(),
  prompt: z.string().min(10).optional(),
  type: z.enum(['FUNCTION_JS', 'REACT_APP', 'FUNCTION_PYTHON']).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  accessTier: z.enum(['FREE', 'PREMIUM']).optional(),
  isPublished: z.boolean().optional(),
  timeLimitMinutes: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  content: z.record(z.unknown()).optional(),
  starterCode: z.record(z.string()).optional(),
  publicTestCode: z.string().optional(),
  hiddenTestCode: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const admin = await authorizeAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message || 'Invalid payload');
  }
  const data = parsed.data;

  const existing = await prisma.question.findUnique({
    where: { id },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } }
  });
  if (!existing) return notFound('Question not found');

  if (data.slug && data.slug !== existing.slug) {
    const clash = await prisma.question.findUnique({ where: { slug: data.slug } });
    if (clash) return badRequest('Slug already in use', 'DUPLICATE_SLUG');
  }

  const latestVersion = existing.versions[0];
  const contentChanged = data.content !== undefined;
  const starterChanged = data.starterCode !== undefined;
  const publishChanged = data.isPublished !== undefined && data.isPublished !== existing.isPublished;

  await prisma.$transaction(async (tx) => {
    await tx.question.update({
      where: { id },
      data: {
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.prompt !== undefined && { prompt: data.prompt }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
        ...(data.accessTier !== undefined && { accessTier: data.accessTier }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
        ...(data.timeLimitMinutes !== undefined && { timeLimitMinutes: data.timeLimitMinutes }),
        ...(data.publicTestCode !== undefined && { publicTestCode: data.publicTestCode }),
        ...(data.hiddenTestCode !== undefined && { hiddenTestCode: data.hiddenTestCode }),
      }
    });

    if (latestVersion && (contentChanged || starterChanged || publishChanged)) {
      const nextPublished = data.isPublished ?? existing.isPublished;
      await tx.questionVersion.update({
        where: { id: latestVersion.id },
        data: {
          ...(contentChanged && { content: data.content as Prisma.InputJsonValue }),
          ...(starterChanged && { starterCode: data.starterCode as Prisma.InputJsonValue }),
          status: nextPublished ? 'PUBLISHED' : 'DRAFT',
          publishedAt: nextPublished ? (latestVersion.publishedAt ?? new Date()) : null,
        }
      });
    }

    if (data.tags !== undefined) {
      const tagIds = await Promise.all(
        data.tags.map(async (name) => {
          const tag = await tx.questionTag.upsert({
            where: { name },
            update: {},
            create: { name }
          });
          return tag.id;
        })
      );
      await tx.questionTagOnQuestion.deleteMany({ where: { questionId: id } });
      if (tagIds.length) {
        await tx.questionTagOnQuestion.createMany({
          data: tagIds.map((tagId) => ({ questionId: id, tagId }))
        });
      }
    }
  });

  await refreshQuestionRenderData(id);

  const updated = await prisma.question.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      versions: { orderBy: { version: 'desc' } },
      officialSolutions: { orderBy: { updatedAt: 'desc' } }
    }
  });

  return NextResponse.json({ question: updated });
}
