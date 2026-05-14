"use client";

import { useMemo, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/utils";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export default function CheckoutButton({
  equipmentId,
  dailyRate,
  ownerStripeAccountId,
}: {
  equipmentId: string;
  dailyRate: number;
  ownerStripeAccountId: string;
}) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Lazy/optional Stripe client — only loaded if a publishable key is configured.
  // Stops the page from crashing in dev when Stripe isn't wired up yet.
  const stripePromise = useMemo<Promise<Stripe | null> | null>(() => {
    if (!PUBLISHABLE_KEY) return null;
    return loadStripe(PUBLISHABLE_KEY);
  }, []);

  const totalCents = dailyRate * Math.max(1, days);

  const handleCheckout = async () => {
    if (!session) {
      window.location.href = `/auth/signin?callbackUrl=/equipment/${equipmentId}`;
      return;
    }

    if (!stripePromise) {
      setError(
        "Payments aren't configured on this Peak yet. Try the Message button to coordinate directly with the owner."
      );
      return;
    }

    if (!Number.isFinite(days) || days <= 0) {
      setError("Pick a valid number of rental days.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equipmentId, days, ownerStripeAccountId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create checkout session.");
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe failed to load. Check your network and try again.");
      }
      const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (result.error) {
        throw new Error(result.error.message || "Checkout redirect failed.");
      }
    } catch (err) {
      console.error("[checkout]", err);
      setError(
        err instanceof Error ? err.message : "Checkout failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !ownerStripeAccountId || !stripePromise;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 justify-between rounded-peak border border-peak-charcoal/10 bg-peak-cream/50 p-3">
        <label htmlFor="rental-days" className="text-sm font-medium text-peak-charcoal">
          How many days?
        </label>
        <select
          id="rental-days"
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="px-3 py-1.5 rounded-peak border border-peak-stone bg-white text-peak-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-peak-forest-500"
        >
          {[1, 2, 3, 4, 5, 7, 14].map((d) => (
            <option key={d} value={d}>
              {d} day{d > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleCheckout}
        disabled={disabled}
        className="w-full py-3 px-4 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading
          ? "Setting up checkout…"
          : `Rent for ${days} day${days > 1 ? "s" : ""} · ${formatCurrency(totalCents)}`}
      </button>

      {!ownerStripeAccountId && (
        <p className="text-xs text-peak-burgundy">
          Owner hasn&rsquo;t finished Stripe onboarding yet. You can still message them.
        </p>
      )}

      {!stripePromise && (
        <p className="text-xs text-peak-charcoal/60">
          Payments aren&rsquo;t wired up on this instance. (Set <code className="font-mono">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to enable.)
        </p>
      )}

      {error && (
        <p className="text-sm text-peak-burgundy" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
