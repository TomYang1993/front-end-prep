import type { Metadata } from 'next';
import { Coffee, Heart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Buy Me a Coffee — Whack The Fullstack Interview',
  description: 'Support the platform with a small tip via PayPal. Every coffee helps keep the questions coming.',
};

export default function CoffeePage() {
  return (
    <div className="max-w-[640px] mx-auto py-16 px-6">

      <div className="text-center mb-10">
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-subtle text-brand mb-5">
          <Coffee size={28} />
        </span>
        <h1 className="text-[clamp(1.8rem,5vw,2.4rem)] font-extrabold tracking-tight mb-3">
          Buy Me a Coffee
        </h1>
        <p className="text-ink-secondary leading-[1.7] text-[0.98rem] max-w-[480px] mx-auto">
          This platform is built and maintained by one person, on nights and weekends.
          If it helped you prep — a small tip keeps new questions coming. Thank you!
        </p>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-8 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-ink-secondary">Pay with</span>
          <span className="text-[0.95rem] font-extrabold tracking-tight text-[#003087]">Pay<span className="text-[#0070ba]">Pal</span></span>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-line-soft">
          {/* Drop your QR code image at /public/paypal-qr.png */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/paypal-qr.png"
            alt="PayPal QR code — scan to tip"
            width={240}
            height={240}
            className="block w-[240px] h-[240px] object-contain"
          />
        </div>

        <p className="mt-6 text-[0.82rem] text-muted text-center leading-[1.6]">
          Scan with your phone camera or the PayPal app to send any amount.
        </p>
      </div>

      <p className="mt-8 text-center text-[0.82rem] text-muted inline-flex items-center justify-center gap-1.5 w-full">
        <Heart size={14} className="text-brand" />
        More payment methods coming soon.
      </p>
    </div>
  );
}
