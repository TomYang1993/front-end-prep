import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="landing-page">
      {/* ─── Hero ─── */}
      <section className="landing-hero">
        <div className="hero-orb hero-orb-left" />
        <div className="hero-orb hero-orb-right" />

        <div className="hero-content">
          <span className="hero-badge">System Status: Operational</span>

          <h1 className="hero-title">
            MASTER THE <br />
            <span className="hero-title-gradient">KINETIC STACK</span>
          </h1>

          <p className="hero-subtitle">
            A high-density archive for the persistent engineer. Deconstruct React patterns,
            optimize JS/TS logic, and master fundamental front-end concepts through clinical precision.
          </p>

          <div className="hero-actions">
            <Link href="/questions" className="btn-kinetic-primary">
              Start Solving Now
            </Link>
            <Link href="/questions" className="btn-kinetic-secondary">
              Explore Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Master Your Stack — Bento Grid ─── */}
      <section className="landing-section">
        <div className="section-heading">
          <h2>Master Your Stack</h2>
          <div className="heading-accent" />
        </div>

        <div className="bento-grid">
          {/* React UI — large card */}
          <div className="bento-card bento-card-wide">
            <span className="bento-icon bento-icon-primary">⚛️</span>
            <h3>React UI Architecture</h3>
            <p>
              Master atomic design, component composition, and design system engineering.
              Build interfaces that scale to millions of users without technical debt.
            </p>
            <div className="bento-chips">
              <span className="bento-chip">Server Components</span>
              <span className="bento-chip">State Orchestration</span>
            </div>
            <div className="bento-glow" />
          </div>

          {/* JS/TS Logic */}
          <div className="bento-card">
            <span className="bento-icon bento-icon-secondary">⚡</span>
            <h3>Logic &amp; Flow</h3>
            <p>
              Deep dive into asynchronous patterns, closure mastery, and type-safe
              architectures with TypeScript.
            </p>
          </div>

          {/* FE Concepts */}
          <div className="bento-card">
            <span className="bento-icon bento-icon-tertiary">🏗️</span>
            <h3>FE Paradigms</h3>
            <p>
              Understanding the browser, rendering cycles, and memory management
              for high-performance applications.
            </p>
          </div>

          {/* Stats bar — wide */}
          <div className="bento-card bento-card-wide bento-stats-bar">
            <div className="bento-stat">
              <span className="bento-stat-number">250+</span>
              <span className="bento-stat-label">Interactive Modules</span>
            </div>
            <div className="bento-stat-divider" />
            <div className="bento-stat">
              <span className="bento-stat-number">99.9%</span>
              <span className="bento-stat-label">Accuracy Rating</span>
            </div>
            <div className="bento-stat-divider bento-stat-divider-hide" />
            <div className="bento-stat bento-stat-hide">
              <span className="bento-stat-number">Archive</span>
              <span className="bento-stat-label">v2.4.0-stable</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Real-World Playground ─── */}
      <section className="landing-section landing-section-dark">
        <div className="landing-section-inner">
          <div className="playground-header">
            <div>
              <h2>Real-World Playground</h2>
              <p className="playground-desc">
                Don&apos;t just read about engineering. Execute. Our low-latency playground mimics
                a local development environment with instant feedback loops.
              </p>
            </div>
          </div>

          <div className="playground-window">
            {/* Editor pane */}
            <div className="playground-editor">
              <div className="editor-tab-bar">
                <span className="editor-filename">editor.tsx</span>
                <div className="editor-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
              </div>
              <div className="editor-code">
                <pre>{`import { ArchiveEngine } from '@kinetic/core';

const Solution = () => {
  return (
    <ArchiveEngine
      mode="clinical"
      onOptimized={() => commit()}
    />
  );
};`}</pre>
              </div>
            </div>

            {/* Preview pane */}
            <div className="playground-preview">
              <div className="preview-glow" />
              <span className="preview-icon">🔬</span>
              <h4>Live Execution</h4>
              <p className="preview-status">STANDBY: COMPILING ARCHIVE...</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Social Proof ─── */}
      <section className="landing-section">
        <h2 className="section-heading-center">Trusted by Senior Engineers</h2>

        <div className="testimonial-grid">
          {[
            {
              quote: 'The high-density approach of The Kinetic Archive is exactly what\'s missing in modern learning. It respects the engineer\'s intelligence and skips the fluff.',
              name: 'Marcus Chen',
              title: 'Staff Engineer @ SynthFlow',
            },
            {
              quote: 'Finally, a resource that focuses on the architectural \'why\' rather than just the syntax \'how\'. Essential for anyone moving from mid to senior level.',
              name: 'Sarah Jenkins',
              title: 'Tech Lead @ Obsidian Systems',
            },
            {
              quote: 'The clinical precision of the UI mirrors the quality of the content. This is the gold standard for front-end education.',
              name: 'David Vo',
              title: 'Principal Frontend @ Nexus',
            },
          ].map((t) => (
            <div key={t.name} className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">👤</div>
                <div>
                  <p className="testimonial-name">{t.name}</p>
                  <p className="testimonial-title">{t.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="landing-cta">
        <h2 className="cta-headline">READY TO EVOLVE?</h2>
        <p className="cta-sub">Join 15,000+ engineers archiving mediocrity and building excellence.</p>
        <div className="cta-form">
          <input
            type="email"
            placeholder="engineer@company.com"
            className="cta-input"
            aria-label="Email address"
          />
          <Link href="/questions" className="btn-kinetic-primary">
            Start Solving Now
          </Link>
        </div>
        <p className="cta-fine-print">Immediate access. No credit card required.</p>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div>
            <p className="footer-brand">The Kinetic Archive</p>
            <p className="footer-copy">© 2024 The Kinetic Archive. Built for the persistent engineer.</p>
          </div>
          <div className="footer-col">
            <h5 className="footer-heading">Platform</h5>
            <Link href="/questions">Documentation</Link>
            <Link href="/questions">API Reference</Link>
            <Link href="/questions">Changelog</Link>
          </div>
          <div className="footer-col">
            <h5 className="footer-heading">Legal</h5>
            <Link href="#">Terms of Service</Link>
            <Link href="#">Privacy Policy</Link>
          </div>
          <div className="footer-col">
            <h5 className="footer-heading">Connect</h5>
            <div className="footer-socials">
              <span>⌨️</span>
              <span>{ }</span>
              <span>&lt;/&gt;</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
