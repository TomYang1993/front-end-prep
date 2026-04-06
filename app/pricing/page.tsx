import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Zap, Crown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing — Whack The Fullstack Interview',
  description: 'Choose a plan to unlock all premium interview questions and features on WTF Interview.',
};

const FREE_FEATURES = [
  'Access to free-tier questions',
  'Live in-browser code playground',
  'JavaScript & TypeScript challenges',
  'Syntax highlighting & auto-complete',
  'Community discussions',
];

const PRO_FEATURES = [
  'Everything in Free',
  'All premium questions unlocked',
  'React component challenges',
  'Detailed editorial solutions',
  'Submission history & progress tracking',
  'Priority support',
  'Early access to new content',
];

export default function PricingPage() {
  return (
    <div className="max-w-[1100px] mx-auto py-8 pb-16 text-center">
      <div className="mb-12">
        <span className="inline-block text-[0.72rem] font-bold uppercase tracking-widest text-brand bg-brand-subtle px-3 py-1 rounded-full mb-3">Simple, Transparent Pricing</span>
        <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-tight leading-[1.15] mt-3 mb-2.5">
          Invest in your <span className="bg-gradient-to-r from-brand to-accent-secondary bg-clip-text text-transparent">career growth</span>
        </h1>
        <p className="text-base text-muted max-w-[440px] mx-auto leading-[1.6]">
          Start free. Upgrade when you&apos;re ready to unlock every question and feature.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5 items-start max-md:grid-cols-1 max-md:max-w-[400px] max-md:mx-auto">
        {/* ─── Free Plan ─── */}
        <div className="relative bg-surface border border-line rounded-2xl px-5 py-7 text-left flex flex-col transition-all duration-200 hover:-translate-y-[3px] hover:shadow-lg">
          <div className="mb-5">
            <span className="inline-flex items-center justify-center w-[42px] h-[42px] rounded-lg mb-2.5 bg-bg-subtle text-muted">
              <Zap size={22} />
            </span>
            <h2 className="text-[1.1rem] font-bold m-0 mb-0.5">Free</h2>
            <p className="text-[0.82rem] text-muted m-0">Get started with core challenges</p>
          </div>

          <div className="flex items-baseline gap-1 mb-5 flex-wrap">
            <span className="text-[2.2rem] font-extrabold tracking-tight text-ink">$0</span>
            <span className="text-[0.88rem] text-muted font-medium">forever</span>
          </div>

          <ul className="list-none m-0 mb-6 p-0 grid gap-2 flex-1">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[0.84rem] text-ink-secondary leading-[1.4]">
                <Check size={16} className="shrink-0 mt-0.5 text-good" />
                {f}
              </li>
            ))}
          </ul>

          <Link href="/questions" className="block text-center w-full py-3 px-4 font-bold text-[0.88rem] rounded-lg transition-all duration-200 hover:-translate-y-[1px] bg-transparent text-ink border border-line hover:bg-bg-subtle hover:border-muted">
            Start Practicing
          </Link>
        </div>

        {/* ─── Pro Monthly ─── */}
        <div className="relative bg-surface border border-brand rounded-2xl px-5 py-7 text-left flex flex-col transition-all duration-200 hover:-translate-y-[3px] hover:shadow-lg shadow-[0_0_0_1px_var(--brand),var(--shadow-lg)] z-[1] max-md:-order-1">
          <div className="absolute -top-[11px] left-1/2 -translate-x-1/2 bg-brand text-brand-ink text-[0.68rem] font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full whitespace-nowrap">Most Popular</div>
          <div className="mb-5">
            <span className="inline-flex items-center justify-center w-[42px] h-[42px] rounded-lg mb-2.5 bg-brand-subtle text-brand">
              <Crown size={22} />
            </span>
            <h2 className="text-[1.1rem] font-bold m-0 mb-0.5">Pro Monthly</h2>
            <p className="text-[0.82rem] text-muted m-0">Full access, billed monthly</p>
          </div>

          <div className="flex items-baseline gap-1 mb-5 flex-wrap">
            <span className="text-[2.2rem] font-extrabold tracking-tight text-ink">$15.99</span>
            <span className="text-[0.88rem] text-muted font-medium">/ month</span>
          </div>

          <ul className="list-none m-0 mb-6 p-0 grid gap-2 flex-1">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[0.84rem] text-ink-secondary leading-[1.4]">
                <Check size={16} className="shrink-0 mt-0.5 text-brand" />
                {f}
              </li>
            ))}
          </ul>

          <Link href="/auth" className="block text-center w-full py-3 px-4 font-bold text-[0.88rem] rounded-lg transition-all duration-200 hover:-translate-y-[1px] bg-brand text-brand-ink hover:bg-brand-hover">
            Get Pro Monthly
          </Link>
        </div>

        {/* ─── Pro Yearly ─── */}
        <div className="relative bg-surface border border-accent-secondary rounded-2xl px-5 py-7 text-left flex flex-col transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_0_0_1px_var(--accent-secondary),var(--shadow-lg)]">
          <div className="absolute -top-[11px] left-1/2 -translate-x-1/2 bg-accent-secondary text-white text-[0.68rem] font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full whitespace-nowrap">Save 37%</div>
          <div className="mb-5">
            <span className="inline-flex items-center justify-center w-[42px] h-[42px] rounded-lg mb-2.5 bg-[rgba(124,58,237,0.1)] text-accent-secondary">
              <Crown size={22} />
            </span>
            <h2 className="text-[1.1rem] font-bold m-0 mb-0.5">Pro Yearly</h2>
            <p className="text-[0.82rem] text-muted m-0">Best value, billed annually</p>
          </div>

          <div className="flex items-baseline gap-1 mb-5 flex-wrap">
            <span className="text-[2.2rem] font-extrabold tracking-tight text-ink">$10</span>
            <span className="text-[0.88rem] text-muted font-medium">/ month</span>
            <span className="w-full text-[0.76rem] text-accent-secondary font-semibold -mt-0.5">Billed as $120/year</span>
          </div>

          <ul className="list-none m-0 mb-6 p-0 grid gap-2 flex-1">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[0.84rem] text-ink-secondary leading-[1.4]">
                <Check size={16} className="shrink-0 mt-0.5 text-brand" />
                {f}
              </li>
            ))}
          </ul>

          <Link href="/auth" className="block text-center w-full py-3 px-4 font-bold text-[0.88rem] rounded-lg transition-all duration-200 hover:-translate-y-[1px] bg-brand text-brand-ink hover:bg-brand-hover">
            Get Pro Yearly
          </Link>
        </div>
      </div>

      <p className="mt-10 text-[0.8rem] text-muted">
        All plans include a 7-day money-back guarantee. Cancel anytime — no questions asked.
      </p>
    </div>
  );
}
