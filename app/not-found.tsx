import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="stack-gap">
      <h1>Page not found</h1>
      <p>The requested resource does not exist.</p>
      <Link href="/" className="btn">
        Go home
      </Link>
    </section>
  );
}
