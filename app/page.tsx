import Link from 'next/link';
import { Atom, Zap, Timer, ArrowRight, Youtube, Twitter } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="w-screen ml-[calc(-50vw+50%)] -mt-8 -mb-16">
      {/* ─── Hero ─── */}
      <section className="relative min-h-[88vh] flex items-center justify-center pt-32 pb-24 px-6 overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-[15%] left-[10%] w-[320px] h-[320px] bg-brand/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[20%] right-[8%] w-[280px] h-[280px] bg-purple-500/8 rounded-full blur-[90px] pointer-events-none animate-pulse [animation-delay:1s]" />
        <div className="relative z-10 text-center max-w-[820px]">
          <h1 className="text-[clamp(2rem,10vw,3.2rem)] md:text-[clamp(2.8rem,7.5vw,5rem)] font-extrabold leading-[1.05] tracking-tight mb-7">
            Ace Your <br />
            <span className="bg-gradient-to-r from-brand to-blue-400 dark:to-blue-300 focus-mode:from-[#d4a054] focus-mode:to-[#e8c48a] bg-clip-text text-transparent">Fullstack Interview</span>
          </h1>

          <p className="text-ink-secondary max-w-[580px] mx-auto mb-11 text-[1.08rem] leading-[1.75]">
            Sharpen your fullstack skills with hands-on challenges.
            Questions are updated regularly to keep up with current trends in the job market.
            Completely free — and if you&apos;re feeling generous, <a href="#" className="text-brand underline underline-offset-2 font-semibold hover:text-brand-hover transition-colors">buy me a coffee</a>!
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/questions" className="inline-flex items-center gap-2 bg-gradient-to-br from-brand to-accent-secondary text-white py-[0.9rem] px-[2.2rem] rounded-[12px] font-bold text-[0.95rem] tracking-tight transition-all duration-200 shadow-[0_4px_24px_color-mix(in_srgb,var(--brand)_25%,transparent)] hover:-translate-y-[2px] hover:shadow-[0_8px_32px_color-mix(in_srgb,var(--brand)_30%,transparent)] hover:brightness-105 active:translate-y-0 active:scale-[0.98]">
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
            <span className="flex items-center justify-center w-11 h-11 rounded-[10px] mb-5 bg-accent-secondary/12 text-accent-secondary"><Zap size={24} /></span>
            <h3 className="text-[1.25rem] font-bold mb-2 tracking-tight">Just for fun!</h3>
            <p className="text-ink-secondary leading-[1.65] m-0 text-[0.92rem]">
              Most of the website will be built by AI. Fun Project!
            </p>
          </div>

          <div className="bg-surface border border-line rounded-xl p-8 relative overflow-hidden md:col-span-4 transition-all duration-300 hover:border-brand/30 hover:-translate-y-1 hover:shadow-md group">
            <span className="flex items-center justify-center w-11 h-11 rounded-[10px] mb-5 bg-accent-tertiary/12 text-accent-tertiary"><Timer size={24} /></span>
            <h3 className="text-[1.25rem] font-bold mb-2 tracking-tight">Practice with a Timebox</h3>
            <p className="text-ink-secondary leading-[1.65] m-0 text-[0.92rem]">
              In real interviews, you&apos;re always on the clock. Our interview mode enforces actual time limits to give you real interview pressure. Surprisingly, most platforms don&apos;t offer this.
            </p>
          </div>

          {/* Supported languages — wide */}
          <div className="bg-surface border border-line rounded-xl p-8 relative overflow-hidden md:col-span-8 transition-all duration-300 hover:border-brand/30 hover:shadow-md group flex items-center justify-evenly flex-wrap">
            <h3 className="w-full text-center text-[0.78rem] font-semibold text-muted mb-3 tracking-wide">Supported Languages and Frameworks for Now</h3>
            <div className="text-center flex-1">
              <span className="block text-[1.3rem] font-extrabold tracking-tight bg-gradient-to-br from-ink to-muted bg-clip-text text-transparent">JavaScript</span>
            </div>
            <div className="w-[1px] h-6 bg-line shrink-0" />
            <div className="text-center flex-1">
              <span className="block text-[1.3rem] font-extrabold tracking-tight bg-gradient-to-br from-ink to-muted bg-clip-text text-transparent">TypeScript</span>
            </div>
            <div className="w-[1px] h-6 bg-line shrink-0" />
            <div className="text-center flex-1">
              <span className="block text-[1.3rem] font-extrabold tracking-tight bg-gradient-to-br from-ink to-muted bg-clip-text text-transparent">React</span>
            </div>
            <div className="w-[1px] h-6 bg-line shrink-0" />
            <div className="text-center flex-1">
              <span className="block text-[1.3rem] font-extrabold tracking-tight bg-gradient-to-br from-ink to-muted bg-clip-text text-transparent">Python</span>
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
