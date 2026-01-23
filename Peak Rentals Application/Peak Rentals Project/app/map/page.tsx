"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Equipment } from "@prisma/client";
import { OwnerCard } from "@/components/map/OwnerCard";

// Dynamically import PeakMap to avoid SSR issues with Mapbox
const PeakMap = dynamic(() => import("@/components/map/PeakMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-peak-cream">
      <div className="text-center">
        <div className="text-4xl mb-2">🗺️</div>
        <div className="text-peak-charcoal font-medium">Loading map...</div>
      </div>
    </div>
  ),
});

interface EquipmentWithOwner extends Equipment {
  owner: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl?: string | null;
    locationName?: string | null;
    bio?: string | null;
    memberSince?: Date;
    foundingMember?: boolean;
    peaksBalance?: number;
    flavor?: string | null;
  };
}

export default function MapPage() {
  const { data: session, status } = useSession();
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentWithOwner | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Not logged in state
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-peak-cream flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <h1 className="font-serif text-3xl font-bold text-peak-charcoal mb-4">
            Welcome to Peak
          </h1>
          <p className="text-peak-charcoal/70 mb-6">
            Sign in to explore gear from your trusted network and discover equipment
            shared by friends of friends.
          </p>
          <Link
            href="/auth/signin"
            className="inline-block px-6 py-3 bg-peak-forest text-white font-medium rounded-peak hover:bg-peak-forest/90 transition-colors shadow-peak"
          >
            Sign In to Explore
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-peak-cream flex items-center justify-center">
        <div className="text-peak-charcoal font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-peak-cream">
      {/* Header */}
      <header className="bg-white border-b border-peak-charcoal/10 px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⛰️</span>
            <h1 className="font-serif text-xl font-bold text-peak-charcoal">Peak</h1>
          </Link>
        </div>

        <nav className="flex items-center gap-4">
          <Link
            href="/browse"
            className="text-sm text-peak-charcoal/70 hover:text-peak-charcoal transition-colors"
          >
            Browse
          </Link>
          <Link
            href="/cards"
            className="text-sm text-peak-charcoal/70 hover:text-peak-charcoal transition-colors"
          >
            Cards
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-peak-charcoal/70 hover:text-peak-charcoal transition-colors"
          >
            Dashboard
          </Link>
          <div className="w-8 h-8 rounded-full bg-peak-forest text-white flex items-center justify-center text-sm font-medium">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <Suspense
            fallback={
              <div className="h-full w-full flex items-center justify-center bg-peak-cream">
                <div className="text-peak-charcoal">Loading map...</div>
              </div>
            }
          >
            <PeakMap
              onEquipmentSelect={(equipment) => {
                setSelectedEquipment(equipment);
                setSidebarOpen(true);
              }}
            />
          </Suspense>
        </div>

        {/* Sidebar */}
        <aside
          className={`
            absolute md:relative top-0 right-0 h-full w-80 bg-white border-l border-peak-charcoal/10
            transform transition-transform duration-300 z-10
            ${sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0 md:w-0"}
          `}
        >
          {/* Sidebar Toggle (mobile) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute -left-10 top-4 w-10 h-10 bg-white rounded-l-lg shadow-lg flex items-center justify-center md:hidden"
          >
            {sidebarOpen ? "→" : "←"}
          </button>

          {/* Sidebar Content */}
          <div className="h-full overflow-y-auto p-4">
            {selectedEquipment ? (
              <div className="space-y-4">
                {/* Selected Equipment */}
                <div className="pb-4 border-b border-peak-charcoal/10">
                  <h2 className="font-serif text-lg font-bold text-peak-charcoal mb-1">
                    {selectedEquipment.name}
                  </h2>
                  <span className="inline-block px-2 py-0.5 text-xs font-medium bg-peak-forest/10 text-peak-forest rounded-full">
                    {selectedEquipment.category}
                  </span>
                  <p className="text-sm text-peak-charcoal/70 mt-2">
                    {selectedEquipment.description}
                  </p>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-2xl font-bold text-peak-forest">
                      ${selectedEquipment.pricePerDay}
                    </span>
                    <span className="text-sm text-peak-charcoal/60">/day</span>
                  </div>
                  <Link
                    href={`/equipment/${selectedEquipment.id}`}
                    className="block w-full mt-4 px-4 py-2 bg-peak-forest text-white text-center font-medium rounded-lg hover:bg-peak-forest/90 transition-colors"
                  >
                    View Details & Book
                  </Link>
                </div>

                {/* Owner Card */}
                <div>
                  <h3 className="text-sm font-medium text-peak-charcoal/60 mb-2">
                    Owner
                  </h3>
                  <OwnerCard owner={selectedEquipment.owner} compact />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🎿</div>
                <h3 className="font-serif text-lg font-bold text-peak-charcoal mb-2">
                  Explore Your Network
                </h3>
                <p className="text-sm text-peak-charcoal/70">
                  Click on a pin to see equipment details and connect with the owner.
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t border-peak-charcoal/10">
              <h3 className="text-sm font-medium text-peak-charcoal/60 mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link
                  href="/network"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-peak-charcoal hover:bg-peak-cream rounded-lg transition-colors"
                >
                  <span>🤝</span>
                  <span>View Trust Network</span>
                </Link>
                <Link
                  href="/equipment/new"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-peak-charcoal hover:bg-peak-cream rounded-lg transition-colors"
                >
                  <span>➕</span>
                  <span>List Your Gear</span>
                </Link>
                <Link
                  href="/cards"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-peak-charcoal hover:bg-peak-cream rounded-lg transition-colors"
                >
                  <span>🃏</span>
                  <span>Contact Cards</span>
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
