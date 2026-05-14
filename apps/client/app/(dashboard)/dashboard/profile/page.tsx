import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPeaks, determineTier, getTierDisplay } from "@/lib/peaks";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      name: true,
      role: true,
      stripeAccountId: true,
      flavor: true,
      locationName: true,
      foundingMember: true,
      memberSince: true,
      peaksBalance: true,
      avatarUrl: true,
    },
  });

  if (!user) redirect("/auth/signin");

  const tier = determineTier(user.peaksBalance);
  const tierDisplay = getTierDisplay(tier);

  const memberSince = user.memberSince
    ? new Date(user.memberSince).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      <div className="peak-frame bg-white rounded-peak p-6">
        <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
          Profile
        </p>
        <h1 className="font-serif text-2xl font-bold text-peak-charcoal">
          {user.name ?? "You"}
        </h1>
        {user.flavor && (
          <p className="mt-2 text-peak-charcoal/70 italic">
            &ldquo;{user.flavor}&rdquo;
          </p>
        )}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Stat label="Email" value={user.email ?? "—"} />
          <Stat label="Role" value={user.role} />
          {user.locationName && (
            <Stat label="Location" value={user.locationName} />
          )}
          {memberSince && <Stat label="Member since" value={memberSince} />}
          <Stat
            label="Peaks balance"
            value={
              <span className="flex items-baseline gap-1">
                <span
                  className="font-bold"
                  style={{ color: tierDisplay.color }}
                >
                  {formatPeaks(user.peaksBalance)}
                </span>
                <span className="text-peak-charcoal/50">
                  ⛰️ {tierDisplay.name}
                </span>
              </span>
            }
          />
          {user.foundingMember && (
            <Stat
              label="Badge"
              value={<span className="text-peak-brass">⭐ Founder</span>}
            />
          )}
        </div>
      </div>

      <div className="peak-frame bg-white rounded-peak p-6">
        <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
          Payouts
        </p>
        <h2 className="font-serif text-xl font-bold text-peak-charcoal mb-2">
          Stripe Connect
        </h2>
        {user.stripeAccountId ? (
          <>
            <p className="text-sm text-peak-charcoal/70 mb-3">
              Connected. Stripe Account ID:{" "}
              <code className="font-mono text-[11px] bg-peak-cream px-1.5 py-0.5 rounded">
                {user.stripeAccountId}
              </code>
            </p>
            <Link
              href="/owner/dashboard"
              className="text-sm font-medium text-peak-forest hover:underline"
            >
              Open owner dashboard →
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-peak-charcoal/70 mb-4">
              To receive payouts for listings, complete Stripe onboarding. About
              five minutes; you can still browse + rent without it.
            </p>
            <Link
              href="/owner/onboarding"
              className="inline-block px-5 py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 transition-colors"
            >
              Start Stripe onboarding
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-mono uppercase tracking-[0.15em] text-[10px] text-peak-slate">
        {label}
      </p>
      <p className="text-peak-charcoal mt-0.5">{value}</p>
    </div>
  );
}
