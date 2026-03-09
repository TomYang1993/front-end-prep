import { redirect } from 'next/navigation';
import { AdminQuestionForm } from '@/components/admin-question-form';
import { getCurrentServerUser } from '@/lib/auth/current-user-server';

export default async function AdminPage() {
  const user = await getCurrentServerUser();

  if (!user || !user.roles.includes('ADMIN')) {
    redirect('/questions');
  }

  return (
    <section className="stack-gap">
      <div>
        <h1>Admin CMS</h1>
        <p>Create interview questions, publish starter code, and manage premium tiers.</p>
      </div>
      <AdminQuestionForm />
    </section>
  );
}
