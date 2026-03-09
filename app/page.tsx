import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="hero-grid">
      <div>
        <p className="eyebrow">React-first coding interview prep</p>
        <h1>Practice JS functions and React apps with real judge workflows.</h1>
        <p>
          Solve free and premium questions, run public tests instantly, submit hidden tests, and track your
          submission history.
        </p>
        <div className="cta-row">
          <Link href="/questions" className="btn">
            Start practicing
          </Link>
          <Link href="/discuss" className="btn btn-secondary">
            Join discuss
          </Link>
        </div>
      </div>
      <div className="feature-panel">
        <h2>Built-in platform features</h2>
        <ul>
          <li>Function + React playground modes</li>
          <li>Public and hidden test judging</li>
          <li>Subscription + one-time pack billing</li>
          <li>Submission history and official solutions</li>
          <li>Admin CMS for question authoring</li>
        </ul>
      </div>
    </section>
  );
}
