import Link from "next/link";

export default function BookingCancelPage() {
  return (
    <div className="min-h-screen bg-peak-cream flex items-center justify-center px-4 py-12">
      <div className="peak-frame bg-white rounded-peak p-10 w-full max-w-lg text-center">
        <div className="text-6xl mb-5" aria-hidden>
          🚪
        </div>
        <p className="font-mono uppercase tracking-[0.25em] text-xs text-peak-slate mb-2">
          Checkout cancelled
        </p>
        <h1 className="font-serif text-2xl font-bold text-peak-charcoal mb-3">
          No charge, no worries.
        </h1>
        <p className="text-peak-charcoal/70 mb-6">
          You backed out before payment. The booking didn&rsquo;t go through. Come back when you&rsquo;re ready.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/browse"
            className="px-5 py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 transition-colors"
          >
            Browse equipment
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-peak border border-peak-charcoal/15 text-peak-charcoal hover:bg-peak-cream transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
