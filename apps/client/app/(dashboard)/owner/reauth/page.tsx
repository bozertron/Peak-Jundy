import Link from "next/link";

export default function ReauthPage() {
  return (
    <div className="max-w-2xl bg-white border rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-2">Stripe onboarding incomplete</h1>
      <p className="text-gray-600 mb-6">
        Stripe needs additional information. Click below to reopen onboarding.
      </p>
      <Link href="/owner/onboarding" className="btn-primary">
        Re-open onboarding
      </Link>
    </div>
  );
}
