"use client";

import { useEffect, useState } from "react";

type StripeAccountStatus = {
  hasAccount?: boolean;
  charges_enabled?: boolean;
  details_submitted?: boolean;
};

export default function PaymentStatus() {
  const [status, setStatus] = useState<StripeAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stripe/account-status");
        if (!res.ok) {
          // Stripe likely not configured server-side; render the not-connected card.
          if (!cancelled) setStatus({ hasAccount: false });
          return;
        }
        const data = await res.json();
        if (!cancelled) setStatus(data);
      } catch (err) {
        if (!cancelled) {
          console.error("[payment-status]", err);
          setError("Couldn't check Stripe status. Try refreshing.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="peak-frame bg-white rounded-peak p-4 text-sm text-peak-charcoal/60">
        Checking Stripe status…
      </div>
    );
  }

  if (error) {
    return (
      <div className="peak-frame bg-white rounded-peak p-4 text-sm text-peak-burgundy border-peak-burgundy/30">
        {error}
      </div>
    );
  }

  if (!status?.hasAccount) {
    return (
      <div className="peak-frame bg-white rounded-peak p-5">
        <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-peak-slate mb-2">
          Payouts
        </p>
        <p className="font-medium text-peak-charcoal">
          Stripe Connect not yet linked.
        </p>
        <p className="text-sm text-peak-charcoal/70 mt-1">
          Until you onboard, listings are visible but you can&rsquo;t accept
          payment for rentals.
        </p>
      </div>
    );
  }

  const ok = status.charges_enabled && status.details_submitted;

  return (
    <div
      className={`peak-frame rounded-peak p-5 ${
        ok
          ? "bg-peak-forest/5 border-peak-forest/30"
          : "bg-peak-brass/5 border-peak-brass/30"
      }`}
    >
      <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-peak-slate mb-2">
        Payouts
      </p>
      <p className="font-medium text-peak-charcoal mb-2">
        {ok
          ? "Stripe Connect is fully wired up."
          : "Onboarding still has open requirements."}
      </p>
      <ul className="text-xs text-peak-charcoal/70 space-y-0.5">
        <li>
          <span className="font-mono text-peak-charcoal/50">
            charges_enabled:
          </span>{" "}
          {String(status.charges_enabled)}
        </li>
        <li>
          <span className="font-mono text-peak-charcoal/50">
            details_submitted:
          </span>{" "}
          {String(status.details_submitted)}
        </li>
      </ul>
      {!ok && (
        <p className="text-xs text-peak-charcoal/60 mt-3">
          Head to{" "}
          <a href="/owner/reauth" className="text-peak-forest underline">
            re-onboarding
          </a>{" "}
          to finish.
        </p>
      )}
    </div>
  );
}
