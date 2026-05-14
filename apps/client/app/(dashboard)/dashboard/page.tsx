import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  determineTier,
  getTierDisplay,
  calculateTierProgress,
  formatPeaks,
} from "@/lib/peaks";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  USER: "Renter",
  OWNER: "Owner",
  ADMIN: "Admin",
};

export default async function DashboardHome() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;
  const role = session.user.role ?? "USER";

  const [user, activeRentals, listings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        flavor: true,
        peaksBalance: true,
        foundingMember: true,
        locationName: true,
      },
    }),
    prisma.booking.count({
      where: { renterId: userId, status: { in: ["PENDING", "CONFIRMED"] } },
    }),
    prisma.equipment.count({ where: { ownerId: userId } }),
  ]);

  const peaksBalance = user?.peaksBalance ?? 0;
  const tier = determineTier(peaksBalance);
  const tierDisplay = getTierDisplay(tier);
  const tierProgress = calculateTierProgress(peaksBalance);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="peak-frame bg-white rounded-peak p-6">
        <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
          Welcome back
        </p>
        <h1 className="font-serif text-3xl font-bold text-peak-charcoal">
          {user?.name ?? "Hey"} — the lodge is open.
        </h1>
        {user?.flavor && (
          <p className="mt-2 text-peak-charcoal/70 italic">
            &ldquo;{user.flavor}&rdquo;
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-peak-charcoal/70">
            {ROLE_LABEL[role] ?? role}
          </span>
          {user?.locationName && (
            <>
              <span className="text-peak-charcoal/30">·</span>
              <span className="text-peak-charcoal/60">
                📍 {user.locationName}
              </span>
            </>
          )}
          {user?.foundingMember && (
            <span className="text-xs font-medium bg-peak-brass/15 text-peak-brass px-2 py-0.5 rounded-full">
              ⭐ Founder
            </span>
          )}
        </div>
      </div>

      {/* Peaks + counts grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Peaks tier card */}
        <div className="peak-frame bg-white rounded-peak p-5 flex flex-col">
          <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-peak-slate mb-2">
            Peaks balance
          </p>
          <div className="flex items-baseline gap-2 mb-3">
            <span
              className="font-serif text-4xl font-bold"
              style={{ color: tierDisplay.color }}
            >
              {formatPeaks(peaksBalance)}
            </span>
            <span className="text-sm text-peak-charcoal/60">⛰️</span>
          </div>
          <p className="text-sm font-medium text-peak-charcoal mb-1">
            {tierDisplay.name}
          </p>
          <p className="text-xs text-peak-charcoal/60 mb-3">
            {tierDisplay.description}
          </p>
          {tierProgress.nextTier && tierProgress.peaksToNextTier > 0 && (
            <>
              <div className="h-1.5 rounded-full bg-peak-stone/40 overflow-hidden mt-auto">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${tierProgress.progressPercent}%`,
                    backgroundColor: tierDisplay.color,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-peak-charcoal/60">
                {formatPeaks(tierProgress.peaksToNextTier)} more to{" "}
                {getTierDisplay(tierProgress.nextTier).name}
              </p>
            </>
          )}
        </div>

        {/* Active rentals */}
        <div className="peak-frame bg-white rounded-peak p-5">
          <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-peak-slate mb-2">
            Active rentals
          </p>
          <p className="font-serif text-4xl font-bold text-peak-charcoal mb-1">
            {activeRentals}
          </p>
          <p className="text-xs text-peak-charcoal/60 mb-4">
            {activeRentals === 0
              ? "Nothing on the slope right now."
              : "Out on the slope."}
          </p>
          <Link
            href="/dashboard/rentals"
            className="text-sm font-medium text-peak-forest hover:underline"
          >
            View my rentals →
          </Link>
        </div>

        {/* Listings */}
        <div className="peak-frame bg-white rounded-peak p-5">
          <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-peak-slate mb-2">
            My listings
          </p>
          <p className="font-serif text-4xl font-bold text-peak-charcoal mb-1">
            {listings}
          </p>
          <p className="text-xs text-peak-charcoal/60 mb-4">
            {listings === 0
              ? "Nothing listed yet."
              : `${listings === 1 ? "Piece" : "Pieces"} of gear earning their keep.`}
          </p>
          <Link
            href={listings > 0 ? "/dashboard/listings" : "/owner/onboarding"}
            className="text-sm font-medium text-peak-forest hover:underline"
          >
            {listings > 0 ? "Manage listings →" : "List your gear →"}
          </Link>
        </div>
      </div>

      {/* Quick links */}
      <div>
        <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-3">
          Around the lodge
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickLink
            href="/browse"
            emoji="🪧"
            title="Browse equipment"
            body="Find what you need."
          />
          <QuickLink
            href="/map"
            emoji="🗺️"
            title="Open the map"
            body="See gear nearby."
          />
          <QuickLink
            href="/network"
            emoji="🤝"
            title="My trust network"
            body="The people Peak runs on."
          />
          <QuickLink
            href="/cards"
            emoji="🪪"
            title="Contact cards"
            body="Your collected network."
          />
          <QuickLink
            href="/owner/create-listing"
            emoji="🛠️"
            title="List equipment"
            body="Got gear gathering dust?"
          />
          <QuickLink
            href="/dashboard/profile"
            emoji="⛺"
            title="Profile + payouts"
            body="Stripe Connect, identity."
          />
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  emoji,
  title,
  body,
}: {
  href: string;
  emoji: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="peak-frame bg-white rounded-peak p-5 hover:-translate-y-0.5 hover:shadow-peak-lift transition-all duration-200 block group"
    >
      <div className="text-2xl mb-2" aria-hidden>
        {emoji}
      </div>
      <h3 className="font-serif text-lg font-bold text-peak-charcoal mb-1 group-hover:text-peak-forest transition-colors">
        {title}
      </h3>
      <p className="text-sm text-peak-charcoal/60">{body}</p>
    </Link>
  );
}
