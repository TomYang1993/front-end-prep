import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUserFromRequest } from '@/lib/auth/current-user';
import { getEntitlementContext, canAccessQuestion } from '@/lib/auth/entitlement';

export async function GET(req: NextRequest) {
  const difficulty = req.nextUrl.searchParams.get('difficulty');
  const type = req.nextUrl.searchParams.get('type');
  const tag = req.nextUrl.searchParams.get('tag');

  const user = await getCurrentUserFromRequest(req);
  const entitlement = user ? await getEntitlementContext(user.id) : null;

  const rows = await prisma.question.findMany({
    where: {
      isPublished: true,
      ...(difficulty ? { difficulty: difficulty as 'EASY' | 'MEDIUM' | 'HARD' } : {}),
      ...(type ? { type: type as 'FUNCTION_JS' | 'REACT_APP' } : {}),
      ...(tag
        ? {
            tags: {
              some: {
                tag: {
                  name: tag
                }
              }
            }
          }
        : {})
    },
    include: {
      tags: {
        include: {
          tag: true
        }
      }
    },
    orderBy: [{ difficulty: 'asc' }, { createdAt: 'desc' }]
  });

  return NextResponse.json({
    questions: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      prompt: row.prompt,
      difficulty: row.difficulty,
      type: row.type,
      accessTier: row.accessTier,
      locked: !canAccessQuestion(row.accessTier, row.id, entitlement),
      tags: row.tags.map((item) => item.tag.name)
    }))
  });
}
