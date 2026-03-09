import Link from 'next/link';

export default function BillingCancelPage() {
  return (
    <section className="stack-gap">
      <h1>Checkout canceled</h1>
      <p>No charges were made. You can retry anytime.</p>
      <Link className="btn btn-secondary" href="/questions">
        Return to questions
      </Link>
    </section>
  );
}
