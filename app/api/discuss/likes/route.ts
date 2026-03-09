import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { badRequest, unauthorized } from '@/lib/api';
import { requireUser } from '@/lib/auth/current-user';

const bodySchema = z.object({
  threadId: z.string().optional(),
  commentId: z.string().optional()
}).refine((value) => Boolean(value.threadId) !== Boolean(value.commentId), {
  message: 'Provide either threadId or commentId'
});

export async function POST(req: NextRequest) {
  const user = await requireUser(req).catch(() => null);
  if (!user) {
    return unauthorized();
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message || 'Invalid like payload');
  }

  const { threadId, commentId } = parsed.data;
  const existing = await prisma.discussionLike.findFirst({
    where: {
      userId: user.id,
      ...(threadId ? { threadId } : {}),
      ...(commentId ? { commentId } : {})
    }
  });

  if (existing) {
    await prisma.discussionLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }

  await prisma.discussionLike.create({
    data: {
      userId: user.id,
      threadId,
      commentId
    }
  });

  return NextResponse.json({ liked: true });
}
