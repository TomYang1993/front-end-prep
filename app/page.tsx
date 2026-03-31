import Link from 'next/link';
import { Atom, Zap, Blocks, Microscope, ArrowRight, Youtube, Twitter } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="landing-page">
      {/* ─── Hero ─── */}
      <section className="landing-hero">
        <div className="hero-orb hero-orb-left" />
        <div className="hero-orb hero-orb-right" />

        <div className="hero-content">
          <span className="hero-badge">Practice. Build. Ship.</span>

          <h1 className="hero-title">
            Ace Your <br />
            <span className="hero-title-gradient">Whack The Fullstack Interview</span>
          </h1>

          <p className="hero-subtitle">
            Sharpen your JavaScript, TypeScript, and React skills with hands-on challenges.
            Write real code in a live playground, get instant feedback, and build the
            confidence to crush your next technical interview.
          </p>

          <div className="hero-actions">
            <Link href="/questions" className="btn-landing-primary">
              Start Practicing
              <ArrowRight size={16} />
            </Link>
            <Link href="/questions" className="btn-landing-secondary">
              Browse Questions
            </Link>
          </div>
        </div>
      </section>

      {/* ─── What You'll Master — Bento Grid ─── */}
      <section className="landing-section">
        <div className="section-heading">
          <h2>What You&apos;ll Master</h2>
          <div className="heading-accent" />
        </div>

        <div className="bento-grid">
          {/* React — large card */}
          <div className="bento-card bento-card-wide">
            <span className="bento-icon bento-icon-primary"><Atom size={24} /></span>
            <h3>React &amp; Component Design</h3>
            <p>
              Build production-grade components, manage complex state, and understand
              the rendering lifecycle. From hooks to server components.
            </p>
            <div className="bento-chips">
              <span className="bento-chip">Hooks</span>
              <span className="bento-chip">Server Components</span>
              <span className="bento-chip">State Management</span>
            </div>
            <div className="bento-glow" />
          </div>

          {/* JS/TS Logic */}
          <div className="bento-card">
            <span className="bento-icon bento-icon-secondary"><Zap size={24} /></span>
            <h3>JavaScript &amp; TypeScript</h3>
            <p>
              Closures, async patterns, prototypes, generics, and the type system —
              the fundamentals that interviewers love to test.
            </p>
          </div>

          {/* FE Concepts */}
          <div className="bento-card">
            <span className="bento-icon bento-icon-tertiary"><Blocks size={24} /></span>
            <h3>Frontend Fundamentals</h3>
            <p>
              DOM APIs, event delegation, performance optimization, accessibility,
              and browser internals.
            </p>
          </div>

          {/* Stats bar — wide */}
          <div className="bento-card bento-card-wide bento-stats-bar">
            <div className="bento-stat">
              <span className="bento-stat-number">3</span>
              <span className="bento-stat-label">Categories</span>
            </div>
            <div className="bento-stat-divider" />
            <div className="bento-stat">
              <span className="bento-stat-number">JS &middot; TS &middot; React</span>
              <span className="bento-stat-label">Languages &amp; Frameworks</span>
            </div>
            <div className="bento-stat-divider bento-stat-divider-hide" />
            <div className="bento-stat bento-stat-hide">
              <span className="bento-stat-number">Live</span>
              <span className="bento-stat-label">In-Browser Execution</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Live Playground ─── */}
      <section className="landing-section landing-section-dark">
        <div className="landing-section-inner">
          <div className="playground-header">
            <div>
              <h2>Code in a Live Playground</h2>
              <p className="playground-desc">
                No local setup needed. Write your solution in a real editor with syntax highlighting,
                run it against test cases, and see results instantly — all in your browser.
              </p>
            </div>
          </div>

          <div className="playground-window">
            {/* Editor pane */}
            <div className="playground-editor">
              <div className="editor-tab-bar">
                <span className="editor-filename">solution.tsx</span>
                <div className="editor-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
              </div>
              <div className="editor-code">
                <pre>{`function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebounced(value),
      delay
    );
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}`}</pre>
              </div>
            </div>

            {/* Preview pane */}
            <div className="playground-preview">
              <div className="preview-glow" />
              <span className="preview-icon"><Microscope size={32} /></span>
              <h4>Test Results</h4>
              <p className="preview-status">ALL TESTS PASSING</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="landing-cta">
        <h2 className="cta-headline">Ready to level up?</h2>
        <p className="cta-sub">
          Jump in and start solving problems. No sign-up wall — just pick a question and code.
        </p>
        <Link href="/questions" className="btn-landing-primary btn-landing-lg">
          Browse All Questions
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div>
            <p className="footer-brand">Whack The Fullstack Interview</p>
            <p className="footer-copy">&copy; {new Date().getFullYear()} Whack The Fullstack Interview. Built for engineers, by engineers.</p>
          </div>
          <div className="footer-col">
            <h5 className="footer-heading">Platform</h5>
            <Link href="/questions">Questions</Link>
            <Link href="/discuss">Discussions</Link>
          </div>
          <div className="footer-col">
            <h5 className="footer-heading">Legal</h5>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </div>
          <div className="footer-col">
            <h5 className="footer-heading">Connect</h5>
            <div className="footer-socials">
              <span className="footer-social-icon"><Youtube size={18} /></span>
              <span className="footer-social-icon"><Twitter size={18} /></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
