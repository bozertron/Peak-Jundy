import OwnerOnboarding from "@/components/Stripe/OwnerOnboarding";
import PaymentStatus from "@/components/Stripe/PaymentStatus";

export const dynamic = "force-dynamic";

export default function OwnerOnboardingPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="peak-frame bg-white rounded-peak p-6">
        <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
          Owner setup
        </p>
        <h1 className="font-serif text-2xl font-bold text-peak-charcoal">
          One time: get set up to get paid.
        </h1>
      </div>
      <PaymentStatus />
      <OwnerOnboarding />
    </div>
  );
}
