import Link from "next/link";
import SearchBar from "@/components/Search/SearchBar";
import EquipmentGrid from "@/components/Equipment/EquipmentGrid";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SEVEN_DAYS_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

export default async function HomePage() {
  const [featured, stats] = await Promise.all([
    prisma.equipment.findMany({
      where: { available: true },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { owner: { select: { name: true, stripeAccountId: true } } },
    }),
    gatherCommunityStats(),
  ]);

  return (
    <div className="min-h-screen bg-peak-cream">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Wood-tone accent bar — Peak's signature */}
        <div
          className="h-1 w-full"
          style={{
            background:
              "linear-gradient(90deg, #C8A87A 0%, #B8860B 50%, #8B4513 100%)",
          }}
        />

        <div className="max-w-5xl mx-auto px-4 pt-20 pb-16 md:pt-28 md:pb-24 text-center">
          <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-4">
            Big White Village · Equipment · Community
          </p>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-peak-charcoal mb-6 leading-[1.05]">
            Equipment rental, the way mountain communities already trust each other.
          </h1>
          <p className="text-lg md:text-xl text-peak-charcoal/70 max-w-2xl mx-auto mb-10">
            Vouch-gated peer-to-peer rental for the people you&rsquo;d already lend
            your tools to. Built around trust, made for the kind of gear that&rsquo;s
            too valuable to hand to a stranger.
          </p>

          <div className="max-w-xl mx-auto mb-6">
            <SearchBar />
          </div>

          <div className="flex items-center justify-center gap-3 text-sm">
            <Link
              href="/browse"
              className="px-5 py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 transition-colors"
            >
              Browse equipment
            </Link>
            <Link
              href="/map"
              className="px-5 py-2.5 rounded-peak border border-peak-charcoal/15 text-peak-charcoal hover:bg-white transition-colors"
            >
              Open the map
            </Link>
          </div>
        </div>
      </section>

      {/* Community stats strip */}
      <section className="bg-white border-t border-peak-charcoal/10">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-peak-slate text-center mb-4">
            On the mountain right now
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatChip
              label="Neighbors on Peak"
              value={stats.totalMembers}
              suffix=""
            />
            <StatChip
              label="Pieces of gear listed"
              value={stats.totalEquipment}
              suffix=""
            />
            <StatChip
              label="Vouches this week"
              value={stats.vouchesThisWeek}
              suffix=""
            />
            <StatChip
              label="Founding members"
              value={stats.founders}
              suffix=" ⭐"
            />
          </div>
        </div>
      </section>

      {/* Featured equipment */}
      <section className="bg-peak-cream">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
                Featured
              </p>
              <h2 className="font-serif text-3xl font-bold text-peak-charcoal">
                Equipment nearby
              </h2>
            </div>
            <Link
              href="/browse"
              className="text-sm font-medium text-peak-forest hover:underline hidden sm:block"
            >
              See all →
            </Link>
          </div>
          <EquipmentGrid equipment={featured} />
        </div>
      </section>

      {/* The three pillars */}
      <section className="bg-white border-t border-peak-charcoal/10">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate text-center mb-3">
            What makes it Peak
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-peak-charcoal text-center mb-12">
            Built around the way trust actually works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Pillar
              emoji="🤝"
              title="Vouch, don't review"
              body="Equipment is visible to people inside your trust network. Vouches expand it outward — to a friend's friends, on your call."
            />
            <Pillar
              emoji="🗺️"
              title="The map is the interface"
              body="Spatial discovery, not search bars. See what's nearby — and stop seeing what isn't yours to see."
            />
            <Pillar
              emoji="⛰️"
              title="Peaks for participation"
              body="Vouches, rentals, profile work all earn Peaks. Five tiers — Explorer to Alpine Elite — and treasure chests to spend them on."
            />
          </div>
        </div>
      </section>

      {/* Lodge invitation */}
      <section className="bg-peak-cream">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-3">
            How to get involved
          </p>
          <h2 className="font-serif text-3xl font-bold text-peak-charcoal mb-4">
            New around here?
          </h2>
          <p className="text-peak-charcoal/70 max-w-2xl mx-auto mb-8">
            Sign in. Browse. If you&rsquo;ve got gear, list it. If you know
            someone already in, ask them to vouch. The network grows one
            handshake at a time.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth/signin"
              className="px-5 py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 transition-colors"
            >
              Sign in / sign up
            </Link>
            <Link
              href="/owner/onboarding"
              className="px-5 py-2.5 rounded-peak border border-peak-charcoal/15 text-peak-charcoal hover:bg-white transition-colors"
            >
              List your gear
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

interface CommunityStats {
  totalMembers: number;
  totalEquipment: number;
  vouchesThisWeek: number;
  founders: number;
}

async function gatherCommunityStats(): Promise<CommunityStats> {
  try {
    const [totalMembers, totalEquipment, vouchesThisWeek, founders] =
      await Promise.all([
        prisma.user.count(),
        prisma.equipment.count({ where: { available: true } }),
        prisma.vouch.count({ where: { createdAt: { gte: SEVEN_DAYS_AGO() } } }),
        prisma.user.count({ where: { foundingMember: true } }),
      ]);
    return { totalMembers, totalEquipment, vouchesThisWeek, founders };
  } catch (err) {
    // If the DB isn't reachable, render zeros instead of crashing the home page.
    console.error("[home] stats failed", err);
    return {
      totalMembers: 0,
      totalEquipment: 0,
      vouchesThisWeek: 0,
      founders: 0,
    };
  }
}

function StatChip({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix: string;
}) {
  return (
    <div className="text-center">
      <p className="font-serif text-3xl font-bold text-peak-charcoal">
        {value.toLocaleString()}
        {suffix && (
          <span className="text-base font-normal ml-1">{suffix}</span>
        )}
      </p>
      <p className="text-xs text-peak-charcoal/60 mt-0.5">{label}</p>
    </div>
  );
}

function Pillar({
  emoji,
  title,
  body,
}: {
  emoji: string;
  title: string;
  body: string;
}) {
  return (
    <div className="peak-frame p-6 bg-peak-cream/40">
      <div className="text-3xl mb-3" aria-hidden>
        {emoji}
      </div>
      <h3 className="font-serif text-lg font-bold text-peak-charcoal mb-2">
        {title}
      </h3>
      <p className="text-peak-charcoal/70 text-sm leading-relaxed">{body}</p>
    </div>
  );
}
