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
    <div className="pricing-page">
      <div className="pricing-header">
        <span className="hero-badge">Simple, Transparent Pricing</span>
        <h1 className="pricing-title">
          Invest in your <span className="hero-title-gradient">career growth</span>
        </h1>
        <p className="pricing-subtitle">
          Start free. Upgrade when you&apos;re ready to unlock every question and feature.
        </p>
      </div>

      <div className="pricing-grid">
        {/* ─── Free Plan ─── */}
        <div className="pricing-card">
          <div className="pricing-card-header">
            <span className="pricing-icon pricing-icon-free">
              <Zap size={22} />
            </span>
            <h2 className="pricing-plan-name">Free</h2>
            <p className="pricing-plan-desc">Get started with core challenges</p>
          </div>

          <div className="pricing-price">
            <span className="pricing-amount">$0</span>
            <span className="pricing-period">forever</span>
          </div>

          <ul className="pricing-features">
            {FREE_FEATURES.map((f) => (
              <li key={f}>
                <Check size={16} className="pricing-check" />
                {f}
              </li>
            ))}
          </ul>

          <Link href="/questions" className="btn pricing-btn pricing-btn-secondary">
            Start Practicing
          </Link>
        </div>

        {/* ─── Pro Monthly ─── */}
        <div className="pricing-card pricing-card-featured">
          <div className="pricing-badge">Most Popular</div>
          <div className="pricing-card-header">
            <span className="pricing-icon pricing-icon-pro">
              <Crown size={22} />
            </span>
            <h2 className="pricing-plan-name">Pro Monthly</h2>
            <p className="pricing-plan-desc">Full access, billed monthly</p>
          </div>

          <div className="pricing-price">
            <span className="pricing-amount">$15.99</span>
            <span className="pricing-period">/ month</span>
          </div>

          <ul className="pricing-features">
            {PRO_FEATURES.map((f) => (
              <li key={f}>
                <Check size={16} className="pricing-check pricing-check-pro" />
                {f}
              </li>
            ))}
          </ul>

          <Link href="/auth" className="btn pricing-btn pricing-btn-primary">
            Get Pro Monthly
          </Link>
        </div>

        {/* ─── Pro Yearly ─── */}
        <div className="pricing-card pricing-card-yearly">
          <div className="pricing-badge pricing-badge-save">Save 37%</div>
          <div className="pricing-card-header">
            <span className="pricing-icon pricing-icon-yearly">
              <Crown size={22} />
            </span>
            <h2 className="pricing-plan-name">Pro Yearly</h2>
            <p className="pricing-plan-desc">Best value, billed annually</p>
          </div>

          <div className="pricing-price">
            <span className="pricing-amount">$10</span>
            <span className="pricing-period">/ month</span>
            <span className="pricing-billed">Billed as $120/year</span>
          </div>

          <ul className="pricing-features">
            {PRO_FEATURES.map((f) => (
              <li key={f}>
                <Check size={16} className="pricing-check pricing-check-pro" />
                {f}
              </li>
            ))}
          </ul>

          <Link href="/auth" className="btn pricing-btn pricing-btn-primary">
            Get Pro Yearly
          </Link>
        </div>
      </div>

      <p className="pricing-footnote">
        All plans include a 7-day money-back guarantee. Cancel anytime — no questions asked.
      </p>
    </div>
  );
}
