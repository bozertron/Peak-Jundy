import Link from "next/link";

export default function ReauthPage() {
  return (
    <div className="peak-frame bg-white rounded-peak p-6 max-w-2xl">
      <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
        Stripe needs more info
      </p>
      <h1 className="font-serif text-2xl font-bold text-peak-charcoal mb-2">
        Onboarding paused.
      </h1>
      <p className="text-peak-charcoal/70 mb-5">
        Stripe wants a bit more before payouts can flow. Re-open onboarding to
        finish.
      </p>
      <Link
        href="/owner/onboarding"
        className="inline-block px-5 py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 transition-colors"
      >
        Re-open onboarding
      </Link>
    </div>
  );
}
