import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Whack The Fullstack Interview',
  description: 'How Whack The Fullstack Interview collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <nav className="inline-flex items-center gap-1.5 text-[0.78rem] text-muted mb-5">
        <Link href="/" className="text-muted no-underline transition-colors duration-150 hover:text-brand">Home</Link>
        <span className="text-line">/</span>
        <span>Privacy Policy</span>
      </nav>

      <h1>Privacy Policy</h1>
      <span className="block text-[0.78rem] text-muted mb-8 pb-5 border-b border-line-soft">Last updated: March 30, 2026</span>

      <p>
        Whack The Fullstack Interview (&quot;WTF Interview,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to
        protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your
        information when you use our website and services.
      </p>

      <h2>1. Information We Collect</h2>

      <h3>Account Information</h3>
      <p>
        When you create an account, we collect the information you provide, which may include:
      </p>
      <ul>
        <li>Email address</li>
        <li>Authentication provider information (e.g., Google account identifier)</li>
        <li>Display name (if provided)</li>
      </ul>

      <h3>Usage Data</h3>
      <p>
        We automatically collect certain information when you interact with the platform:
      </p>
      <ul>
        <li>Code submissions and submission history</li>
        <li>Questions viewed and attempted</li>
        <li>Browser type, operating system, and device information</li>
        <li>Pages visited and time spent on pages</li>
      </ul>

      <h3>Local Storage &amp; Cookies</h3>
      <p>
        We use browser local storage and cookies for functional purposes:
      </p>
      <ul>
        <li><strong>Theme preference</strong> — storing your selected light/dark/focus mode</li>
        <li><strong>Session token</strong> — maintaining your authenticated session</li>
        <li><strong>Editor state</strong> — preserving your code between sessions</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, maintain, and improve the platform</li>
        <li>Manage your account and authenticate your identity</li>
        <li>Store and display your submission history</li>
        <li>Analyze usage patterns to improve content and user experience (in aggregate, anonymized form)</li>
        <li>Communicate important updates about the service</li>
      </ul>
      <p>
        We do <strong>not</strong> sell your personal information to third parties. We do <strong>not</strong> use
        your data for advertising or marketing purposes beyond platform-related communications.
      </p>

      <h2>3. Third-Party Services</h2>
      <p>
        We use the following trusted third-party services to operate the platform:
      </p>
      <ul>
        <li><strong>Supabase</strong> — authentication and database hosting</li>
        <li><strong>Vercel</strong> — website hosting and edge delivery</li>
      </ul>
      <p>
        These services have their own privacy policies, and we encourage you to review them. We only share the
        minimum information necessary for these services to function.
      </p>

      <h2>4. Data Security</h2>
      <p>
        We implement appropriate technical and organizational measures to protect your information, including
        encrypted connections (HTTPS), secure authentication protocols, and access controls. However, no
        method of electronic storage or transmission is 100% secure, and we cannot guarantee absolute security.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        We retain your account information and submission history for as long as your account is active.
        If you request account deletion, we will remove your personal data within 30 days, except where
        we are required to retain it for legal or operational purposes.
      </p>

      <h2>6. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access the personal information we hold about you</li>
        <li>Request correction of inaccurate information</li>
        <li>Request deletion of your account and associated data</li>
        <li>Withdraw consent for data processing at any time</li>
      </ul>
      <p>
        To exercise any of these rights, please contact us at the email address below.
      </p>

      <h2>7. Children&apos;s Privacy</h2>
      <p>
        WTF Interview is not directed at children under the age of 13. We do not knowingly collect personal
        information from children under 13. If you believe a child under 13 has provided us with personal
        information, please contact us and we will promptly delete it.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material changes by
        posting the updated policy on this page and updating the &quot;Last updated&quot; date. Your continued
        use of the platform after changes constitutes acceptance of the revised policy.
      </p>

      <h2>9. Contact Us</h2>
      <div className="bg-surface border border-line rounded-xl p-4 my-6 text-[0.88rem] text-ink-secondary [&_strong]:block [&_strong]:mb-1 [&_strong]:text-ink [&_strong]:font-semibold">
        <strong>Questions about this Privacy Policy?</strong>
        Reach out to us at{' '}
        <a href="mailto:xy.tomyang@gmail.com">xy.tomyang@gmail.com</a>
      </div>
    </div>
  );
}
