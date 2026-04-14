import { Suspense } from 'react';
import { AuthForm } from '@/components/auth-form';
import { AuthGate } from '@/components/auth-gate';

export default function AuthPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const fromQuestion = searchParams.next?.startsWith('/questions/');

  return (
    <section className="stack-gap">
      {fromQuestion && <AuthGate />}
      <Suspense>
        <AuthForm />
      </Suspense>
    </section>
  );
}
