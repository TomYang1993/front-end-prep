import Link from 'next/link';

export default function BillingSuccessPage() {
  return (
    <section className="stack-gap">
      <h1>Payment successful</h1>
      <p>Your entitlement will unlock after webhook processing completes.</p>
      <Link className="btn" href="/questions">
        Back to questions
      </Link>
    </section>
  );
}
