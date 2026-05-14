import { prisma } from "@/lib/prisma";
import SearchBar from "@/components/Search/SearchBar";
import EquipmentGrid from "@/components/Equipment/EquipmentGrid";
import type { Prisma } from "@prisma/client";

interface BrowsePageProps {
  searchParams: {
    q?: string;
    category?: string;
  };
}

export const dynamic = "force-dynamic";

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const q = (searchParams.q ?? "").trim();
  const category = (searchParams.category ?? "").trim();

  const where: Prisma.EquipmentWhereInput = {
    available: true,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(category
      ? { category: { equals: category, mode: "insensitive" } }
      : {}),
  };

  const equipment = await prisma.equipment.findMany({
    where,
    take: 60,
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { name: true, stripeAccountId: true } } },
  });

  // Log unfulfilled searches (fire-and-forget; never blocks the response).
  if (q && equipment.length === 0) {
    prisma.searchLog
      .create({ data: { query: q, fulfilled: false } })
      .catch((err: unknown) => {
        console.error("[browse] failed to log unfulfilled search", err);
      });
  }

  const showingSearch = Boolean(q || category);

  return (
    <div className="min-h-screen bg-peak-cream">
      <section className="border-b border-peak-charcoal/10 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
            {showingSearch ? "Results" : "Catalog"}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-peak-charcoal mb-6">
            {showingSearch
              ? q
                ? `Looking for "${q}"`
                : `${category} in your network`
              : "Equipment around the mountain"}
          </h1>
          <div className="max-w-3xl">
            <SearchBar initialQuery={q} initialCategory={category} size="lg" />
          </div>
          {showingSearch && (
            <p className="mt-4 text-sm text-peak-charcoal/70">
              {equipment.length} {equipment.length === 1 ? "match" : "matches"}
              {category ? (
                <span>
                  {" "}
                  in <span className="font-medium">{category}</span>
                </span>
              ) : null}
              .
            </p>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-10">
        <EquipmentGrid
          equipment={equipment}
          emptyTitle={
            showingSearch
              ? "Nothing matches yet."
              : "The catalog is quiet."
          }
          emptyBody={
            showingSearch
              ? "Try a different category, broaden the search, or check back tomorrow. We log unfulfilled searches so owners can see the demand."
              : "No equipment listed yet. If you've got gear gathering dust, head to Owner Dashboard to put it to work."
          }
        />
      </section>
    </div>
  );
}
