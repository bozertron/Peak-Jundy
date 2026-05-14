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

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch("/api/stripe/account-status");
        const data = await res.json();
        setStatus(data);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, []);

  if (loading) return <div className="text-sm text-gray-600">Checking Stripe status…</div>;
  if (!status?.hasAccount) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-900">
        Stripe account not connected yet.
      </div>
    );
  }

  const ok = status.charges_enabled && status.details_submitted;

  return (
    <div className={`border rounded-lg p-4 text-sm ${ok ? "bg-green-50 border-green-200 text-green-900" : "bg-yellow-50 border-yellow-200 text-yellow-900"}`}>
      <div className="font-semibold mb-1">Stripe Connect Status</div>
      <div>charges_enabled: {String(status.charges_enabled)}</div>
      <div>details_submitted: {String(status.details_submitted)}</div>
      {!ok && (
        <div className="mt-2 text-xs">
          You may need to re-open onboarding if requirements are pending.
        </div>
      )}
    </div>
  );
}
