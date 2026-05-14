import Link from "next/link";
import SearchBar from "@/components/Search/SearchBar";
import EquipmentGrid from "@/components/Equipment/EquipmentGrid";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const featured = await prisma.equipment.findMany({
    where: { available: true },
    take: 6,
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { name: true, stripeAccountId: true } } },
  });

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
            Vouch-gated peer-to-peer rental for the people you'd already lend
            your tools to. Built around trust, made for the kind of gear that's
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

      {/* Featured equipment */}
      <section className="bg-white border-t border-peak-charcoal/10">
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
      <section className="bg-peak-cream">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate text-center mb-3">
            What makes it Peak
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-peak-charcoal text-center mb-12">
            Built around the way trust actually works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Pillar
              title="Vouch, don't review"
              body="Equipment is visible to people inside your trust network. Vouches expand it outward — to a friend's friends, on your call."
            />
            <Pillar
              title="The map is the interface"
              body="Spatial discovery, not search bars. See what's nearby — and stop seeing what isn't yours to see."
            />
            <Pillar
              title="Peaks for participation"
              body="Vouches, rentals, profile work all earn Peaks. Five tiers — Explorer to Alpine Elite — and treasure chests to spend them on."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div className="peak-frame p-6 bg-white">
      <h3 className="font-serif text-lg font-bold text-peak-charcoal mb-2">
        {title}
      </h3>
      <p className="text-peak-charcoal/70 text-sm leading-relaxed">{body}</p>
    </div>
  );
}
