import EquipmentForm from "@/components/Equipment/EquipmentForm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CreateListingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const isOwner = session.user.role === "OWNER" || session.user.role === "ADMIN";
  if (!isOwner) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <h1 className="text-2xl font-bold">Create Listing</h1>
          <p className="text-sm text-gray-600 mt-2">
            Complete Stripe onboarding to unlock owner listing tools.
          </p>
          <div className="mt-4">
            <Link className="btn-primary" href="/owner/onboarding">
              Start Stripe Onboarding
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Create Listing</h1>
      <EquipmentForm mode="create" />
    </div>
  );
}
