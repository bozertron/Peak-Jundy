import EquipmentForm from "@/components/Equipment/EquipmentForm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CreateListingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const isOwner =
    session.user.role === "OWNER" || session.user.role === "ADMIN";
  if (!isOwner) {
    return (
      <div className="peak-frame bg-white rounded-peak p-6 max-w-3xl">
        <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
          New listing
        </p>
        <h1 className="font-serif text-2xl font-bold text-peak-charcoal mb-3">
          Owner tools come with Stripe onboarding.
        </h1>
        <p className="text-peak-charcoal/70 mb-5">
          Five-minute setup so payouts flow straight to you. Then list as much
          gear as you like.
        </p>
        <Link
          href="/owner/onboarding"
          className="inline-block px-5 py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 transition-colors"
        >
          Start Stripe onboarding
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="peak-frame bg-white rounded-peak p-6">
        <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
          New listing
        </p>
        <h1 className="font-serif text-2xl font-bold text-peak-charcoal">
          Add gear to the catalog
        </h1>
        <p className="text-peak-charcoal/70 text-sm mt-2">
          Spec it accurately. Photos help. Be honest about hours and wear —
          word travels fast in mountain towns.
        </p>
      </div>
      <EquipmentForm mode="create" />
    </div>
  );
}
