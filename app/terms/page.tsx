import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — Whack The Fullstack Interview',
  description: 'Terms and conditions for using the Whack The Fullstack Interview platform.',
};

export default function TermsPage() {
  return (
    <div className="legal-page">
      <nav className="legal-breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>Terms of Service</span>
      </nav>

      <h1>Terms of Service</h1>
      <span className="legal-last-updated">Last updated: March 30, 2026</span>

      <p>
        Welcome to Whack The Fullstack Interview (&quot;WTF Interview,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
        By accessing or using our platform, you agree to be bound by these Terms of Service. If you
        do not agree, please do not use the platform.
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By creating an account or using any part of the platform, you acknowledge that you have read,
        understood, and agree to these Terms. We may update these Terms from time to time, and continued
        use of the platform after changes constitutes acceptance.
      </p>

      <h2>2. Account Responsibilities</h2>
      <p>
        If you create an account, you are responsible for:
      </p>
      <ul>
        <li>Maintaining the confidentiality of your login credentials</li>
        <li>All activities that occur under your account</li>
        <li>Providing accurate and up-to-date information</li>
        <li>Notifying us immediately of any unauthorized use of your account</li>
      </ul>

      <h2>3. Platform Content &amp; Intellectual Property</h2>

      <h3>Our Content</h3>
      <p>
        All questions, problem descriptions, test cases, editorial solutions, and other educational
        content on WTF Interview are <strong>original works</strong> created by us. This content is
        protected by copyright and intellectual property laws.
      </p>
      <p>You may <strong>not</strong>:</p>
      <ul>
        <li>Reproduce, redistribute, or republish our questions or editorial content without express written permission</li>
        <li>Use automated tools (scrapers, bots) to extract content from the platform</li>
        <li>Create derivative works based on our questions for commercial purposes</li>
        <li>Share question content on other coding platforms or forums in a way that reproduces the original work</li>
      </ul>

      <h3>Your Solutions</h3>
      <p>
        You retain full ownership of the code you write and submit on the platform. By submitting code,
        you grant us a limited, non-exclusive license to store and display your submissions within the
        platform (e.g., in your submission history). You are free to use your own solutions anywhere
        you wish, including in your portfolio, blog posts, or other projects.
      </p>

      <h2>4. Original Content &amp; NDA Compliance</h2>
      <p>
        Our interview questions are <strong>original creative works</strong>. While they cover common
        patterns and topics frequently tested in real-world frontend engineering interviews, they are
        not reproductions of any company&apos;s proprietary interview questions.
      </p>
      <p>
        Many companies require candidates to sign Non-Disclosure Agreements (NDAs) regarding their
        interview processes. To be clear:
      </p>
      <ul>
        <li>WTF Interview is <strong>not affiliated</strong> with any company&apos;s hiring process</li>
        <li>Our content is independently developed and does not reproduce NDA-protected material</li>
        <li>Any resemblance to specific company interview questions is coincidental and stems from the shared nature of fundamental computer science and frontend engineering concepts</li>
      </ul>

      <h2>5. Acceptable Use</h2>
      <p>When using the platform, you agree <strong>not</strong> to:</p>
      <ul>
        <li>Submit malicious code designed to harm the platform or other users</li>
        <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
        <li>Use the platform for any unlawful purpose</li>
        <li>Interfere with or disrupt the platform&apos;s infrastructure</li>
        <li>Reverse-engineer, decompile, or disassemble any part of the platform</li>
        <li>Impersonate any person or entity</li>
      </ul>

      <h2>6. Service Availability</h2>
      <p>
        We strive to keep WTF Interview available at all times, but we do not guarantee uninterrupted
        access. We may modify, suspend, or discontinue any aspect of the platform at any time without
        notice. We are not liable for any downtime or data loss.
      </p>

      <h2>7. Disclaimer of Warranties</h2>
      <p>
        The platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either
        express or implied. We do not warrant that the platform will be error-free, secure, or that
        any content will be accurate or suitable for any particular purpose. Practice on this platform
        does not guarantee success in any job interview.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, WTF Interview and its creator shall not be liable for
        any indirect, incidental, special, consequential, or punitive damages arising from your use of
        the platform, including but not limited to loss of data, lost profits, or damage to your
        computer systems.
      </p>

      <h2>9. Termination</h2>
      <p>
        We reserve the right to suspend or terminate your account at any time if you violate these Terms
        or engage in conduct that we determine, in our sole discretion, is harmful to the platform or
        other users. You may also delete your account at any time by contacting us.
      </p>

      <h2>10. Governing Law</h2>
      <p>
        These Terms shall be governed by and construed in accordance with the laws of the State of
        California, United States, without regard to its conflict of law provisions.
      </p>

      <h2>11. Contact Us</h2>
      <div className="legal-contact">
        <strong>Questions about these Terms?</strong>
        Reach out to us at{' '}
        <a href="mailto:xy.tomyang@gmail.com">xy.tomyang@gmail.com</a>
      </div>
    </div>
  );
}
