"use client";

import CheckoutButton from "@/components/Stripe/CheckoutButton";
import { formatCurrency } from "@/lib/utils";

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
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        Daily rate: <span className="font-semibold">{formatCurrency(dailyRate)}</span>
      </div>
      <CheckoutButton
        equipmentId={equipmentId}
        dailyRate={dailyRate}
        ownerStripeAccountId={ownerStripeAccountId}
      />
      <p className="text-xs text-gray-500">
        Platform fees are calculated automatically at checkout.
      </p>
    </div>
  );
}
