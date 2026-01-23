import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "USER";
  const stripeAccountId = session?.user?.stripeAccountId ?? null;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <div className="mt-4 space-y-2 text-sm text-gray-700">
          <div><b>Email:</b> {session?.user.email}</div>
          <div><b>Role:</b> {role}</div>
          <div><b>Stripe Account:</b> {stripeAccountId ?? "Not connected"}</div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2">Owner Access</h2>
        <p className="text-sm text-gray-600">
          To receive payouts for listings, complete Stripe onboarding.
        </p>
        <div className="mt-4">
          <a className="btn-primary" href="/owner/onboarding">
            Start Stripe Onboarding
          </a>
        </div>
      </div>
    </div>
  );
}
