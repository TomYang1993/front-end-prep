import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminQuestionForm } from '@/components/admin-question-form';
import { getCurrentServerUser } from '@/lib/auth/current-user-server';

export const dynamic = 'force-dynamic';

export default async function AdminNewQuestionPage() {
  const user = await getCurrentServerUser();
  if (!user || !user.roles.includes('ADMIN')) {
    redirect('/questions');
  }

  return (
    <section className="stack-gap">
      <div>
        <Link href="/admin" className="text-sm underline opacity-70">
          ← Back to admin
        </Link>
        <h1>New question</h1>
      </div>
      <AdminQuestionForm />
    </section>
  );
}
