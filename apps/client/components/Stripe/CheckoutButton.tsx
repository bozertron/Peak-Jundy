"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useSession } from "next-auth/react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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

  const handleCheckout = async () => {
    if (!session) {
      window.location.href = `/auth/signin?callbackUrl=/equipment/${equipmentId}`;
      return;
    }

    if (!Number.isFinite(days) || days <= 0) {
      setError("Select a valid number of rental days.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId,
          days,
          ownerStripeAccountId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId: data.sessionId });
    } catch (err) {
      console.error("Checkout error:", err);
      setError(
        err instanceof Error ? err.message : "Checkout failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="font-medium">Rental Days:</label>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg"
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
        disabled={loading || !ownerStripeAccountId}
        className="w-full btn-primary disabled:opacity-50"
      >
        {loading ? "Processing..." : `Rent for ${days} day${days > 1 ? "s" : ""}`}
      </button>

      {!ownerStripeAccountId && (
        <p className="text-sm text-red-600">
          Owner has not completed Stripe onboarding yet.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
