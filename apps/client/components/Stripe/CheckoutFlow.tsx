"use client";

import CheckoutButton from "@/components/Stripe/CheckoutButton";

export default function CheckoutFlow({
  equipmentId,
  dailyRate,
  ownerStripeAccountId,
}: {
  equipmentId: string;
  dailyRate: number;
  ownerStripeAccountId: string;
}) {
  return (
    <div className="space-y-2">
      <CheckoutButton
        equipmentId={equipmentId}
        dailyRate={dailyRate}
        ownerStripeAccountId={ownerStripeAccountId}
      />
      <p className="text-[11px] text-peak-charcoal/50 text-center">
        Platform fee (10%) is calculated at checkout. Owner receives the rest via Stripe Connect.
      </p>
    </div>
  );
}
