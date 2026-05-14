import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  determineTier,
  getTierDisplay,
  calculateTierProgress,
  formatPeaks,
} from "@/lib/peaks";
import ChestList from "@/components/peaks/ChestList";

export const dynamic = "force-dynamic";

const PRIZE_LABEL: Record<string, string> = {
  discount: "Discount",
  physical_item: "Physical item",
  feature_unlock: "Unlock",
  badge: "Badge",
};

export default async function PeaksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/peaks");

  const [user, chests, recentTransactions, claimedChests] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { peaksBalance: true, name: true },
    }),
    prisma.treasureChest.findMany({
      where: { available: true },
      orderBy: { peaksCost: "asc" },
    }),
    prisma.peaksTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.treasureChest.findMany({
      where: { claimedBy: session.user.id },
      orderBy: { claimedAt: "desc" },
    }),
  ]);

  const balance = user?.peaksBalance ?? 0;
  const tier = determineTier(balance);
  const tierDisplay = getTierDisplay(tier);
  const tierProgress = calculateTierProgress(balance);

  return (
    <div className="min-h-screen bg-peak-cream">
      {/* Header */}
      <section className="border-b border-peak-charcoal/10 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
            Peaks
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-peak-charcoal mb-2">
            Your elevation
          </h1>
          <p className="text-peak-charcoal/70 max-w-2xl">
            Peaks aren&rsquo;t money. You can&rsquo;t transfer them, you can&rsquo;t cash them in.
            They&rsquo;re a record of what you&rsquo;ve put into the community — and a key to
            small things that make life on the mountain a little better.
          </p>
        </div>
      </section>

      {/* Balance + tier */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="peak-frame bg-white rounded-peak p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
              Current balance
            </p>
            <p
              className="font-serif text-6xl font-bold mb-2"
              style={{ color: tierDisplay.color }}
            >
              {formatPeaks(balance)}
              <span className="text-2xl ml-2">⛰️</span>
            </p>
            <p
              className="text-lg font-medium"
              style={{ color: tierDisplay.color }}
            >
              {tierDisplay.name}
            </p>
            <p className="text-sm text-peak-charcoal/60 italic mt-1">
              {tierDisplay.description}
            </p>
          </div>

          {tierProgress.nextTier && tierProgress.peaksToNextTier > 0 && (
            <div className="w-full md:w-72">
              <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-peak-slate mb-2">
                To the next ridge
              </p>
              <div className="h-2 rounded-full bg-peak-stone/40 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${tierProgress.progressPercent}%`,
                    backgroundColor: tierDisplay.color,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-peak-charcoal/70">
                {formatPeaks(tierProgress.peaksToNextTier)} more to{" "}
                <span className="font-medium">
                  {getTierDisplay(tierProgress.nextTier).name}
                </span>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Treasure chests */}
      <section className="max-w-5xl mx-auto px-4 pb-10">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-1">
              Treasure chests
            </p>
            <h2 className="font-serif text-2xl font-bold text-peak-charcoal">
              Things to claim with your Peaks
            </h2>
          </div>
          <p className="text-sm text-peak-charcoal/60">
            {chests.length} {chests.length === 1 ? "available" : "available"}
          </p>
        </div>

        <ChestList
          chests={chests.map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            peaksCost: c.peaksCost,
            prizeType: c.prizeType,
            prizeTypeLabel: PRIZE_LABEL[c.prizeType] ?? c.prizeType,
          }))}
          balance={balance}
        />
      </section>

      {/* Side-by-side: claimed history + transactions */}
      <section className="max-w-5xl mx-auto px-4 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Peaks activity */}
        <div className="peak-frame bg-white rounded-peak overflow-hidden">
          <div className="px-5 py-4 border-b border-peak-charcoal/10">
            <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-1">
              Recent activity
            </p>
            <h3 className="font-serif text-lg font-bold text-peak-charcoal">
              Where your Peaks come from
            </h3>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="p-6 text-sm text-peak-charcoal/60 text-center">
              No Peaks earned yet. Start with a vouch — that&rsquo;s how the
              network learns who you trust.
            </div>
          ) : (
            <ul className="divide-y divide-peak-charcoal/5">
              {recentTransactions.map((tx) => (
                <li key={tx.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-peak-charcoal">
                      {labelForReason(tx.reason)}
                    </p>
                    <p className="text-[11px] text-peak-charcoal/50 font-mono">
                      {tx.createdAt.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`font-mono font-semibold ${
                      tx.amount > 0 ? "text-peak-forest" : "text-peak-burgundy"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Claimed chests */}
        <div className="peak-frame bg-white rounded-peak overflow-hidden">
          <div className="px-5 py-4 border-b border-peak-charcoal/10">
            <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-1">
              Your collection
            </p>
            <h3 className="font-serif text-lg font-bold text-peak-charcoal">
              Chests you&rsquo;ve claimed
            </h3>
          </div>
          {claimedChests.length === 0 ? (
            <div className="p-6 text-sm text-peak-charcoal/60 text-center">
              Nothing claimed yet. Save up and treat yourself.
            </div>
          ) : (
            <ul className="divide-y divide-peak-charcoal/5">
              {claimedChests.map((c) => (
                <li key={c.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-peak-charcoal">
                      📦 {c.title}
                    </p>
                    <span className="text-xs text-peak-charcoal/50 font-mono">
                      −{c.peaksCost}
                    </span>
                  </div>
                  {c.prizeValue && (
                    <p className="text-xs text-peak-charcoal/60 mt-1">
                      {c.prizeValue}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Footer hint */}
      <section className="max-w-5xl mx-auto px-4 pb-16 text-center text-sm text-peak-charcoal/60">
        Peaks aren&rsquo;t money. They&rsquo;re a record of what you&rsquo;ve put in.{" "}
        <Link href="/network" className="text-peak-forest underline">
          Add to your trust network
        </Link>{" "}
        to earn more.
      </section>
    </div>
  );
}

function labelForReason(reason: string): string {
  // Mirrors PeaksTransactionReason in lib/peaks.ts. Keep in sync if adding more.
  const labels: Record<string, string> = {
    vouch_given: "Vouched for someone",
    first_interaction: "First handshake",
    rental_complete: "Completed a rental",
    profile_complete: "Filled out your profile",
    referral_success: "Brought someone in",
    founding_bonus: "Founding member bonus",
    seasonal_bonus: "Seasonal bonus",
    chest_opened: "Opened a treasure chest",
    admin_adjustment: "Admin adjustment",
  };
  return labels[reason] ?? reason.replace(/_/g, " ");
}
