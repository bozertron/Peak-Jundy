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
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to start onboarding");
      window.location.href = data.url;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border rounded-lg p-6 space-y-4">
      <h2 className="text-xl font-semibold">Get Paid with Stripe Connect</h2>
      <p className="text-gray-600">
        To list equipment and receive payouts, complete Stripe onboarding.
      </p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      <button className="btn-primary disabled:opacity-50" disabled={loading} onClick={start}>
        {loading ? "Opening..." : "Start Stripe Onboarding"}
      </button>
    </div>
  );
}
