import Link from 'next/link';
import { Atom, Zap, Timer, Microscope, ArrowRight, Youtube, Twitter } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="landing-page">
      {/* ─── Hero ─── */}
      <section className="landing-hero">
        <div className="hero-orb hero-orb-left" />
        <div className="hero-orb hero-orb-right" />

        <div className="hero-content">
          <h1 className="hero-title">
            Ace Your <br />
            <span className="hero-title-gradient">Fullstack Interview</span>
          </h1>

          <p className="hero-subtitle">
            Sharpen your fullstack skills with hands-on challenges.
            Questions are updated regularly to keep up with current trends in the job market.
            Completely free — and if you&apos;re feeling generous, <a href="#" className="hero-coffee-link">buy me a coffee</a>!
          </p>

          <div className="hero-actions">
            <Link href="/questions" className="btn-landing-primary">
              Start Practicing
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── What You'll Master — Bento Grid ─── */}
      <section className="landing-section">
        <div className="section-heading">
          <h2>Why Did I Build This?</h2>
          <div className="heading-accent" />
        </div>

        <div className="bento-grid">
          {/* React — large card */}
          <div className="bento-card bento-card-wide">
            <span className="bento-icon bento-icon-primary"><Atom size={24} /></span>
            <h3>A Knowledge Base, Built from Experience</h3>
            <p>
              As a seasoned engineer, I&apos;ve been through countless interviews. I built this platform to organize what I&apos;ve learned and share it with others — because helping others learn makes you better too.
            </p>
            <div className="bento-glow" />
          </div>

          {/* JS/TS Logic */}
          <div className="bento-card">
            <span className="bento-icon bento-icon-secondary"><Zap size={24} /></span>
            <h3>Just for fun!</h3>
            <p>
              Most of the website will be built by AI. Fun Project!
            </p>
          </div>

          <div className="bento-card">
            <span className="bento-icon bento-icon-tertiary"><Timer size={24} /></span>
            <h3>Practice with a Timebox</h3>
            <p>
              In real interviews, you&apos;re always on the clock. Our interview mode enforces actual time limits to give you real interview pressure. Surprisingly, most platforms don&apos;t offer this.
            </p>
          </div>

          {/* Supported languages — wide */}
          <div className="bento-card bento-card-wide bento-stats-bar">
            <h3 className="bento-stats-title">Supported Languages and Frameworks for Now</h3>
            <div className="bento-stat">
              <span className="bento-stat-number">JavaScript</span>
            </div>
            <div className="bento-stat-divider" />
            <div className="bento-stat">
              <span className="bento-stat-number">TypeScript</span>
            </div>
            <div className="bento-stat-divider" />
            <div className="bento-stat">
              <span className="bento-stat-number">React</span>
            </div>
            <div className="bento-stat-divider" />
            <div className="bento-stat">
              <span className="bento-stat-number">Python</span>
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
