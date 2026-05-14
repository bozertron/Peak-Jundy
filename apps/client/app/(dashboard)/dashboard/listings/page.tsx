import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;
  const isOwner =
    session.user.role === "OWNER" || session.user.role === "ADMIN";

  if (!isOwner) {
    return (
      <div className="space-y-6">
        <div className="peak-frame bg-white rounded-peak p-6">
          <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
            My listings
          </p>
          <h1 className="font-serif text-2xl font-bold text-peak-charcoal mb-3">
            You&rsquo;re not an owner yet.
          </h1>
          <p className="text-peak-charcoal/70 mb-5">
            Listing equipment requires Stripe Connect onboarding so you can get
            paid. Five minutes; you can still browse and rent in the meantime.
          </p>
          <Link
            href="/owner/onboarding"
            className="inline-block px-5 py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 transition-colors"
          >
            Start Stripe onboarding
          </Link>
        </div>
      </div>
    );
  }

  const items = await prisma.equipment.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="peak-frame bg-white rounded-peak p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
            My listings
          </p>
          <h1 className="font-serif text-2xl font-bold text-peak-charcoal">
            Gear earning its keep
          </h1>
        </div>
        <Link
          href="/owner/create-listing"
          className="px-5 py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 transition-colors"
        >
          + New listing
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="peak-frame bg-white rounded-peak p-10 text-center">
          <div className="text-5xl mb-4" aria-hidden>
            🛠️
          </div>
          <h2 className="font-serif text-xl font-bold text-peak-charcoal mb-2">
            Nothing listed yet.
          </h2>
          <p className="text-peak-charcoal/70 mb-5">
            What&rsquo;s in the shop? Snowmobile, ICF bracing, scissor lift,
            jumping jack tamper — if someone might need it, list it.
          </p>
          <Link
            href="/owner/create-listing"
            className="inline-block px-5 py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 transition-colors"
          >
            Add your first listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((e) => (
            <div
              key={e.id}
              className="peak-frame bg-white rounded-peak overflow-hidden"
            >
              <div className="relative w-full aspect-[5/3] bg-peak-cream">
                {e.image ? (
                  <Image
                    src={e.image}
                    alt={e.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-5xl">
                    🛠️
                  </div>
                )}
                {!e.available && (
                  <span className="absolute top-3 right-3 bg-peak-burgundy text-white text-xs font-medium px-2 py-1 rounded-full">
                    Hidden
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="font-mono uppercase tracking-[0.15em] text-[10px] text-peak-slate">
                  {e.category}
                </p>
                <h3 className="font-serif text-lg font-bold text-peak-charcoal mt-1 mb-2 line-clamp-2">
                  {e.title}
                </h3>
                <div className="flex items-baseline justify-between">
                  <p className="font-serif text-xl font-bold text-peak-forest">
                    {formatCurrency(e.dailyRate)}
                    <span className="text-xs text-peak-charcoal/50 font-sans font-normal">
                      {" "}
                      /day
                    </span>
                  </p>
                  <Link
                    href={`/owner/listings/${e.id}/edit`}
                    className="text-sm font-medium text-peak-forest hover:underline"
                  >
                    Edit →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
