import Link from 'next/link';
import { Atom, Zap, Timer, Microscope, ArrowRight, Youtube, Twitter } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="w-screen ml-[calc(-50vw+50%)] -mt-8 -mb-16">
      {/* ─── Hero ─── */}
      <section className="relative min-h-[88vh] flex items-center justify-center pt-32 pb-24 px-6 overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-[15%] left-[10%] w-[320px] h-[320px] bg-brand/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[20%] right-[8%] w-[280px] h-[280px] bg-purple-500/8 rounded-full blur-[90px] pointer-events-none animate-pulse [animation-delay:1s]" />
        <div className="relative z-10 text-center max-w-[820px]">
          <h1 className="text-[clamp(2.8rem,7.5vw,5rem)] font-extrabold leading-[1.05] tracking-tight mb-7 md:text-[clamp(2rem,10vw,3.2rem)]">
            Ace Your <br />
            <span className="bg-gradient-to-r from-brand to-blue-400 dark:to-blue-300 focus-mode:from-[#d4a054] focus-mode:to-[#e8c48a] bg-clip-text text-transparent">Fullstack Interview</span>
          </h1>

          <p className="text-ink-secondary max-w-[580px] mx-auto mb-11 text-[1.08rem] leading-[1.75]">
            Sharpen your fullstack skills with hands-on challenges.
            Questions are updated regularly to keep up with current trends in the job market.
            Completely free — and if you&apos;re feeling generous, <a href="#" className="text-brand underline underline-offset-2 font-semibold hover:text-brand-hover transition-colors">buy me a coffee</a>!
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/questions" className="inline-flex items-center gap-2 bg-brand text-white py-[0.9rem] px-[2.2rem] rounded-md font-bold text-[0.95rem] tracking-tight transition-all duration-200 shadow-md hover:-translate-y-1 hover:shadow-lg hover:brightness-105 active:translate-y-0 active:scale-95">
              Start Practicing
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── What You'll Master — Bento Grid ─── */}
      <section className="py-24 px-8 max-w-[1200px] mx-auto">
        <div className="mb-12">
          <h2 className="text-[2rem] font-extrabold tracking-tight mb-2">Why Did I Build This?</h2>
          <div className="w-12 h-[3px] bg-brand rounded-[2px]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* React — large card */}
          <div className="bg-surface border border-line rounded-xl p-8 relative overflow-hidden md:col-span-8 transition-all duration-300 hover:border-brand/30 hover:-translate-y-1 hover:shadow-md group">
            <span className="flex items-center justify-center w-11 h-11 rounded-[10px] mb-5 bg-brand-subtle text-brand"><Atom size={24} /></span>
            <h3 className="text-[1.25rem] font-bold mb-2 tracking-tight">A Knowledge Base, Built from Experience</h3>
            <p className="text-ink-secondary leading-[1.65] m-0 text-[0.92rem]">
              As a seasoned engineer, I&apos;ve been through countless interviews. I built this platform to organize what I&apos;ve learned and share it with others — because helping others learn makes you better too.
            </p>
            <div className="absolute -right-10 -bottom-10 w-[200px] h-[200px] bg-brand-subtle rounded-full blur-[60px] pointer-events-none opacity-60 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110" />
          </div>

          {/* JS/TS Logic */}
          <div className="bg-surface border border-line rounded-xl p-8 relative overflow-hidden md:col-span-4 transition-all duration-300 hover:border-brand/30 hover:-translate-y-1 hover:shadow-md group">
            <span className="flex items-center justify-center w-11 h-11 rounded-[10px] mb-5 bg-purple-500/10 text-purple-500"><Zap size={24} /></span>
            <h3 className="text-[1.25rem] font-bold mb-2 tracking-tight">Just for fun!</h3>
            <p className="text-ink-secondary leading-[1.65] m-0 text-[0.92rem]">
              Most of the website will be built by AI. Fun Project!
            </p>
          </div>

          <div className="bg-surface border border-line rounded-xl p-8 relative overflow-hidden md:col-span-4 transition-all duration-300 hover:border-brand/30 hover:-translate-y-1 hover:shadow-md group">
            <span className="flex items-center justify-center w-11 h-11 rounded-[10px] mb-5 bg-amber-500/10 text-amber-500"><Timer size={24} /></span>
            <h3 className="text-[1.25rem] font-bold mb-2 tracking-tight">Practice with a Timebox</h3>
            <p className="text-ink-secondary leading-[1.65] m-0 text-[0.92rem]">
              In real interviews, you&apos;re always on the clock. Our interview mode enforces actual time limits to give you real interview pressure. Surprisingly, most platforms don&apos;t offer this.
            </p>
          </div>

          {/* Supported languages — wide */}
          <div className="bg-surface border border-line rounded-xl p-8 relative overflow-hidden md:col-span-8 transition-all duration-300 hover:border-brand/30 hover:shadow-md group flex items-center justify-evenly flex-wrap">
            <h3 className="w-full text-center text-[0.78rem] font-semibold text-muted mb-3 tracking-wide">Supported Languages and Frameworks for Now</h3>
            <div className="text-center flex-1">
              <span className="block text-[1.3rem] font-extrabold tracking-tight text-ink">JavaScript</span>
            </div>
            <div className="w-[1px] h-6 bg-line shrink-0" />
            <div className="text-center flex-1">
              <span className="block text-[1.3rem] font-extrabold tracking-tight text-ink">TypeScript</span>
            </div>
            <div className="w-[1px] h-6 bg-line shrink-0" />
            <div className="text-center flex-1">
              <span className="block text-[1.3rem] font-extrabold tracking-tight text-ink">React</span>
            </div>
            <div className="w-[1px] h-6 bg-line shrink-0" />
            <div className="text-center flex-1">
              <span className="block text-[1.3rem] font-extrabold tracking-tight text-ink">Python</span>
            </div>
          </div>
        </div>

      </section>

      {/* ─── Live Playground ─── */}
      <section className="py-24 px-8 max-w-[1200px] mx-auto max-w-none bg-bg-subtle border-y border-line-soft focus-mode:bg-[#15140f] w-full">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between md:items-end mb-10 gap-4">
            <div>
              <h2 className="text-[2rem] font-extrabold tracking-tight mb-2">Code in a Live Playground</h2>
              <p className="text-ink-secondary max-w-[540px] m-0 leading-[1.7] text-[0.95rem] mt-2">
                No local setup needed. Write your solution in a real editor with syntax highlighting,
                run it against test cases, and see results instantly — all in your browser.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row rounded-lg overflow-hidden shadow-lg ring-1 ring-line transition-all duration-300 hover:ring-brand/30 hover:shadow-brand/5 hover:-translate-y-1">
            {/* Editor pane */}
            <div className="flex-1 bg-surface min-h-[360px]">
              <div className="flex justify-between items-center py-2 px-5 bg-surface-raised border-b border-line">
                <span className="text-[0.65rem] uppercase tracking-widest font-mono text-muted">solution.tsx</span>
                <div className="flex gap-[6px]">
                  <span className="w-[10px] h-[10px] rounded-full bg-[#ff5f57]" />
                  <span className="w-[10px] h-[10px] rounded-full bg-[#febc2e]" />
                  <span className="w-[10px] h-[10px] rounded-full bg-[#28c840]" />
                </div>
              </div>
              <div className="p-6">
                <pre className="text-[0.85rem] leading-[1.7] text-ink-secondary font-mono">{`function useDebounce<T>(value: T, delay: number): T {
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
            <div className="w-full md:w-[260px] min-h-[200px] bg-bg dark:bg-surface flex flex-col items-center justify-center text-center p-8 relative border-t md:border-t-0 md:border-l border-line">
              <div className="absolute inset-0 bg-good/5 animate-pulse pointer-events-none" />
              <span className="flex items-center justify-center w-14 h-14 rounded-xl bg-brand-subtle text-brand mb-4 relative z-10"><Microscope size={32} /></span>
              <h4 className="m-0 mb-1 text-[0.95rem] font-bold relative z-10">Test Results</h4>
              <p className="text-[0.6rem] font-mono text-good tracking-widest uppercase m-0 relative z-10 mt-1">ALL TESTS PASSING</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-line bg-bg focus-mode:bg-[#15140f] py-14 px-8 mt-12">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.8fr_repeat(3,1fr)] gap-8">
          <div>
            <p className="text-[0.7rem] font-bold text-ink tracking-tight mb-2">Whack The Fullstack Interview</p>
            <p className="text-[0.72rem] text-muted leading-[1.6] m-0">&copy; {new Date().getFullYear()} Whack The Fullstack Interview. Built for engineers, by engineers.</p>
          </div>
          <div className="flex flex-col gap-2">
            <h5 className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-secondary m-0 mb-1">Platform</h5>
            <Link href="/questions" className="text-[0.8rem] text-muted transition-colors hover:text-brand">Questions</Link>
            <Link href="/discuss" className="text-[0.8rem] text-muted transition-colors hover:text-brand">Discussions</Link>
          </div>
          <div className="flex flex-col gap-2">
            <h5 className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-secondary m-0 mb-1">Legal</h5>
            <Link href="/terms" className="text-[0.8rem] text-muted transition-colors hover:text-brand">Terms of Service</Link>
            <Link href="/privacy" className="text-[0.8rem] text-muted transition-colors hover:text-brand">Privacy Policy</Link>
          </div>
          <div className="flex flex-col gap-2">
            <h5 className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-secondary m-0 mb-1">Connect</h5>
            <div className="flex gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-sm bg-surface border border-line text-muted cursor-pointer transition-all hover:text-brand hover:border-brand hover:bg-brand-subtle"><Youtube size={18} /></span>
              <span className="flex items-center justify-center w-8 h-8 rounded-sm bg-surface border border-line text-muted cursor-pointer transition-all hover:text-brand hover:border-brand hover:bg-brand-subtle"><Twitter size={18} /></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
