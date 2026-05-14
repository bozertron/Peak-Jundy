"use client";

import { useState } from "react";

export default function OwnerOnboarding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          data?.error || "Couldn't start onboarding. Try again."
        );
      if (!data.url) {
        throw new Error("Onboarding URL missing from response.");
      }
      window.location.href = data.url;
    } catch (e: unknown) {
      console.error("[onboarding]", e);
      setError(e instanceof Error ? e.message : "Onboarding failed to start.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="peak-frame bg-white rounded-peak p-6 space-y-4">
      <div>
        <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-1">
          Stripe Connect
        </p>
        <h2 className="font-serif text-xl font-bold text-peak-charcoal">
          Get paid for the gear you list
        </h2>
      </div>
      <p className="text-peak-charcoal/70">
        Stripe handles the actual money. Peak takes a 10% platform fee on each
        completed rental; everything else goes straight to your Connect
        account. Onboarding is five minutes.
      </p>

      {error && (
        <div
          className="rounded-peak bg-peak-burgundy/5 border border-peak-burgundy/30 text-peak-burgundy p-3 text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={start}
        disabled={loading}
        className="px-5 py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "Opening Stripe…" : "Start Stripe onboarding"}
      </button>
    </div>
  );
}
