import OwnerOnboarding from "@/components/Stripe/OwnerOnboarding";
import PaymentStatus from "@/components/Stripe/PaymentStatus";

export default function OwnerOnboardingPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Owner Onboarding</h1>
      <PaymentStatus />
      <OwnerOnboarding />
    </div>
  );
}
