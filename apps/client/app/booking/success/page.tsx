import Link from "next/link";
import { stripeService } from "@/lib/stripe";
import { formatCurrency } from "@/lib/utils";

interface PageProps {
  searchParams: { session_id?: string };
}

export const dynamic = "force-dynamic";

async function safeRetrieveSession(sessionId: string | undefined) {
  if (!sessionId) return null;
  try {
    return await stripeService.retrieveCheckoutSession(sessionId);
  } catch (err) {
    // Stripe not configured, or session lookup failed. Don't crash the page.
    console.error("[booking-success] could not retrieve session", err);
    return null;
  }
}

export default async function BookingSuccessPage({ searchParams }: PageProps) {
  const session = await safeRetrieveSession(searchParams.session_id);

  return (
    <div className="min-h-screen bg-peak-cream flex items-center justify-center px-4 py-12">
      <div className="peak-frame bg-white rounded-peak p-10 w-full max-w-lg text-center">
        <div className="text-6xl mb-5" aria-hidden>
          🏔️
        </div>
        <p className="font-mono uppercase tracking-[0.25em] text-xs text-peak-slate mb-2">
          Booking confirmed
        </p>
        <h1 className="font-serif text-3xl font-bold text-peak-charcoal mb-3">
          You&rsquo;re in. Enjoy the gear.
        </h1>
        <p className="text-peak-charcoal/70 mb-6 leading-relaxed">
          Your booking is on the books. You&rsquo;ll find it under{" "}
          <span className="font-medium text-peak-charcoal">My Rentals</span>, and
          the owner&rsquo;s been notified.
        </p>

        {session && (
          <div className="rounded-peak border border-peak-charcoal/10 bg-peak-cream/50 p-4 text-left text-sm space-y-1 mb-6">
            <div className="flex justify-between">
              <span className="text-peak-charcoal/60">Amount</span>
              <span className="font-medium text-peak-charcoal">
                {formatCurrency(session.amount_total ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-peak-charcoal/60">Status</span>
              <span className="font-medium text-peak-charcoal capitalize">
                {session.payment_status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-peak-charcoal/60">Receipt</span>
              <span className="font-mono text-[11px] text-peak-charcoal/70 truncate ml-3">
                {session.id}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard/rentals"
            className="px-5 py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 transition-colors"
          >
            View My Rentals
          </Link>
          <Link
            href="/browse"
            className="px-5 py-2.5 rounded-peak border border-peak-charcoal/15 text-peak-charcoal hover:bg-peak-cream transition-colors"
          >
            Keep browsing
          </Link>
        </div>
      </div>
    </div>
  );
}
