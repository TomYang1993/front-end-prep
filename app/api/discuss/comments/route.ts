import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { badRequest, unauthorized } from '@/lib/api';
import { requireUser } from '@/lib/auth/current-user';

const bodySchema = z.object({
  threadId: z.string().min(1),
  body: z.string().min(1).max(5000),
  parentId: z.string().optional()
});

export async function POST(req: NextRequest) {
  const user = await requireUser(req).catch(() => null);
  if (!user) {
    return unauthorized();
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message || 'Invalid comment payload');
  }

  const comment = await prisma.discussionComment.create({
    data: {
      threadId: parsed.data.threadId,
      userId: user.id,
      body: parsed.data.body,
      parentId: parsed.data.parentId
    }
  });

  return NextResponse.json({ comment }, { status: 201 });
}
