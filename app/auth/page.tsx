import { Suspense } from 'react';
import { AuthForm } from '@/components/auth-form';
import { AuthGate } from '@/components/auth-gate';

export default async function AuthPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const searchParams = await searchParamsPromise;
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
