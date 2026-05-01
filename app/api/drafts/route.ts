import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUserFromRequest } from '@/lib/auth/current-user';
import { badRequest, serverError, unauthorized } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) return unauthorized();

    const json = await req.json();
    const { questionId, framework, code } = json;

    if (!questionId || !framework || code === undefined) {
      return badRequest('Missing required fields');
    }

    // Upsert the code draft. We use a composite unique key (userId, questionId, framework)
    // to ensure there's only one draft per problem/framework per user.
    const draft = await prisma.codeDraft.upsert({
      where: {
        userId_questionId_framework: {
          userId: user.id,
          questionId,
          framework
        }
      },
      update: {
        code,
        // Prisma will automatically step `updatedAt` because of `@updatedAt` in schema
      },
      create: {
        userId: user.id,
        questionId,
        framework,
        code
      }
    });

    return NextResponse.json({ success: true, draftId: draft.id });
  } catch (error) {
    console.error('[POST /api/drafts] err:', error);
    return serverError();
  }
}
