import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getCurrentServerUser } from '@/lib/auth/current-user-server';
import { AdminPublishToggle } from '@/components/admin-publish-toggle';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getCurrentServerUser();
  if (!user || !user.roles.includes('ADMIN')) {
    redirect('/questions');
  }

  const questions = await prisma.question.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      difficulty: true,
      accessTier: true,
      isPublished: true,
      updatedAt: true,
    },
  });

  return (
    <section className="stack-gap">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1>Admin · Questions</h1>
          <p className="text-sm opacity-70">{questions.length} total</p>
        </div>
        <Link href="/admin/questions/new" className="btn">
          New question
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left opacity-70">
              <th className="py-2 pr-3">Title</th>
              <th className="py-2 pr-3">Slug</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Diff</th>
              <th className="py-2 pr-3">Tier</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Updated</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id} className="border-t border-white/10">
                <td className="py-2 pr-3 font-medium">{q.title}</td>
                <td className="py-2 pr-3 opacity-80">{q.slug}</td>
                <td className="py-2 pr-3">{q.type}</td>
                <td className="py-2 pr-3">{q.difficulty}</td>
                <td className="py-2 pr-3">{q.accessTier}</td>
                <td className="py-2 pr-3">
                  <AdminPublishToggle id={q.id} isPublished={q.isPublished} />
                </td>
                <td className="py-2 pr-3 opacity-70">
                  {new Date(q.updatedAt).toLocaleDateString()}
                </td>
                <td className="py-2 pr-3">
                  <Link href={`/admin/questions/${q.id}/edit`} className="underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
