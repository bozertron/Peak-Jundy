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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Rent Heavy Equipment On Demand
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Connect with local equipment owners. Rent telehandlers, boom lifts,
            and construction equipment at competitive rates.
          </p>
          <SearchBar />
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Featured Equipment
          </h2>
          <EquipmentGrid equipment={featured} />
        </div>
      </section>
    </div>
  );
}
