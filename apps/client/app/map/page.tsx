"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OwnerCard } from "@/components/map/OwnerCard";
import type { MapEquipment } from "@/components/map/PeakMap";
import { EQUIPMENT_CATEGORIES } from "@/lib/categories";

// ============================================================================
// DYNAMIC IMPORTS
// ============================================================================

// Dynamically import PeakMap to avoid SSR issues with Mapbox
const PeakMap = dynamic(() => import("@/components/map/PeakMap"), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />,
});

// ============================================================================
// TYPES
// ============================================================================

interface EquipmentFromAPI {
  id: string;
  title: string;
  description: string | null;
  category: string;
  dailyRate: number;
  pricePerDay?: number;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  available: boolean;
  owner: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    flavor: string | null;
    latitude: number | null;
    longitude: number | null;
    locationName: string | null;
  };
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function MapLoadingSkeleton() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-peak-cream">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-peak-forest/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-4xl">🗺️</span>
        </div>
        <h3 className="font-serif text-lg font-medium text-peak-charcoal mb-2">
          Loading Map
        </h3>
        <p className="text-sm text-peak-slate">
          Discovering equipment in your network...
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// CATEGORY FILTER BAR
// ============================================================================

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  equipmentCount: number;
}

function CategoryFilterBar({ selectedCategory, onCategoryChange, equipmentCount }: CategoryFilterProps) {
  const categoryEmojis: Record<string, string> = {
    "Telehandler": "🏗️",
    "Boom Lift": "⬆️",
    "Scissor Lift": "✂️",
    "Skid Steer": "🚜",
    "Excavator": "🦾",
    "Compactor": "🔩",
    "ICF Bracing": "🧱",
    "Formwork": "📐",
    "Concrete Tools": "🪣",
    "Other": "📦",
  };

  return (
    <div className="bg-peak-snow/95 backdrop-blur-sm border-b border-peak-stone px-4 py-3">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {/* All button */}
        <button
          onClick={() => onCategoryChange(null)}
          className={`
            flex-shrink-0 px-4 py-2 rounded-peak text-sm font-medium transition-all duration-200
            ${selectedCategory === null
              ? "bg-peak-forest text-white shadow-peak-sm"
              : "bg-peak-cream text-peak-charcoal hover:bg-peak-stone/50"
            }
          `}
        >
          All ({equipmentCount})
        </button>

        {/* Category buttons */}
        {EQUIPMENT_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`
              flex-shrink-0 px-4 py-2 rounded-peak text-sm font-medium transition-all duration-200
              flex items-center gap-2
              ${selectedCategory === category
                ? "bg-peak-forest text-white shadow-peak-sm"
                : "bg-peak-cream text-peak-charcoal hover:bg-peak-stone/50"
              }
            `}
          >
            <span>{categoryEmojis[category] || "📦"}</span>
            <span>{category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-peak-cream/90 z-10">
      <div className="text-center max-w-md px-8">
        <div className="w-20 h-20 rounded-full bg-peak-forest/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">🌲</span>
        </div>
        <h2 className="font-serif text-2xl font-bold text-peak-charcoal mb-3">
          No Equipment in Your Network
        </h2>
        <p className="text-peak-slate mb-6 leading-relaxed">
          Your trust network doesn&apos;t have any equipment listed yet.
          Grow your network by vouching for people you know, or list your own gear!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/network"
            className="px-6 py-3 bg-peak-forest text-white font-medium rounded-peak hover:bg-peak-forest/90 transition-colors shadow-peak"
          >
            Expand Network
          </Link>
          <Link
            href="/owner/create-listing"
            className="px-6 py-3 border-2 border-peak-forest text-peak-forest font-medium rounded-peak hover:bg-peak-forest/5 transition-colors"
          >
            List Your Gear
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// UNAUTHENTICATED STATE
// ============================================================================

function UnauthenticatedState() {
  return (
    <div className="min-h-screen bg-peak-cream flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <div className="w-20 h-20 rounded-full bg-peak-forest/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">🗺️</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-peak-charcoal mb-4">
          Discover Equipment
        </h1>
        <p className="text-peak-slate mb-8 leading-relaxed">
          Sign in to explore gear from your trusted network.
          Discover equipment shared by friends and their connections on an interactive map.
        </p>
        <Link
          href="/auth/signin"
          className="inline-block px-8 py-4 bg-peak-forest text-white text-lg font-medium rounded-peak hover:bg-peak-forest/90 transition-colors shadow-peak"
        >
          Sign In to Explore
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// LOADING STATE
// ============================================================================

function LoadingState() {
  return (
    <div className="min-h-screen bg-peak-cream flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-peak-forest/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-2xl">⛰️</span>
        </div>
        <p className="text-peak-charcoal font-medium">Loading...</p>
      </div>
    </div>
  );
}

// ============================================================================
// SELECTED EQUIPMENT PANEL
// ============================================================================

interface SelectedEquipmentPanelProps {
  equipment: MapEquipment;
  onClose: () => void;
  onMessage: () => void;
}

function SelectedEquipmentPanel({ equipment, onClose, onMessage }: SelectedEquipmentPanelProps) {
  const router = useRouter();

  return (
    <div className="absolute bottom-4 left-4 z-20 md:bottom-auto md:top-20 md:right-4 md:left-auto">
      <OwnerCard
        equipment={{
          id: equipment.id,
          title: equipment.title,
          category: equipment.category,
          dailyRate: equipment.dailyRate,
          imageUrl: equipment.imageUrl,
        }}
        owner={{
          id: equipment.owner.id,
          name: equipment.owner.name,
          avatarUrl: equipment.owner.avatarUrl,
          flavor: equipment.owner.flavor,
        }}
        onMessage={onMessage}
        onViewProfile={() => router.push(`/profile/${equipment.owner.id}`)}
        onClose={onClose}
        className="shadow-peak-lg"
      />
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function MapPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State
  const [equipment, setEquipment] = useState<MapEquipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<MapEquipment | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    const fetchEquipment = async () => {
      if (status !== "authenticated") return;

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (selectedCategory) {
          params.set("category", selectedCategory);
        }

        const res = await fetch(`/api/trust/visible-equipment?${params.toString()}`);

        if (!res.ok) {
          throw new Error("Failed to fetch equipment");
        }

        const data = await res.json();

        // Transform API response to MapEquipment format
        const mapEquipment: MapEquipment[] = (data.equipment || [])
          .filter((item: EquipmentFromAPI) => item.latitude && item.longitude)
          .map((item: EquipmentFromAPI) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            dailyRate: item.dailyRate || item.pricePerDay || 0,
            latitude: item.latitude!,
            longitude: item.longitude!,
            imageUrl: item.imageUrl || undefined,
            available: item.available,
            owner: {
              id: item.owner.id,
              name: item.owner.name || "Anonymous",
              avatarUrl: item.owner.avatarUrl || undefined,
              flavor: item.owner.flavor || undefined,
            },
          }));

        setEquipment(mapEquipment);
      } catch (err) {
        console.error("Error fetching equipment:", err);
        setError(err instanceof Error ? err.message : "Failed to load equipment");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEquipment();
  }, [status, selectedCategory]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handlePinClick = useCallback((equipment: MapEquipment) => {
    setSelectedEquipment(equipment);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedEquipment(null);
  }, []);

  const handleMessage = useCallback(() => {
    if (selectedEquipment) {
      // Navigate to chat or create conversation
      router.push(`/chat/new?ownerId=${selectedEquipment.owner.id}&equipmentId=${selectedEquipment.id}`);
    }
  }, [selectedEquipment, router]);

  const handleCategoryChange = useCallback((category: string | null) => {
    setSelectedCategory(category);
    setSelectedEquipment(null); // Clear selection when filter changes
  }, []);

  // ============================================================================
  // RENDER STATES
  // ============================================================================

  // Not authenticated
  if (status === "unauthenticated") {
    return <UnauthenticatedState />;
  }

  // Loading session
  if (status === "loading") {
    return <LoadingState />;
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="h-screen flex flex-col bg-peak-cream">
      {/* ================================================================== */}
      {/* HEADER */}
      {/* ================================================================== */}
      <header className="bg-peak-snow border-b border-peak-stone px-4 py-3 flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">⛰️</span>
            <h1 className="font-serif text-xl font-bold text-peak-charcoal">
              Peak
            </h1>
          </Link>
          <span className="text-peak-stone">|</span>
          <h2 className="font-serif text-lg text-peak-charcoal">
            Discover
          </h2>
        </div>

        <nav className="flex items-center gap-4">
          <Link
            href="/browse"
            className="text-sm text-peak-slate hover:text-peak-charcoal transition-colors"
          >
            Browse
          </Link>
          <Link
            href="/network"
            className="text-sm text-peak-slate hover:text-peak-charcoal transition-colors"
          >
            Network
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-peak-slate hover:text-peak-charcoal transition-colors"
          >
            Dashboard
          </Link>
          <div className="w-8 h-8 rounded-full bg-peak-forest text-white flex items-center justify-center text-sm font-medium shadow-sm">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
        </nav>
      </header>

      {/* ================================================================== */}
      {/* CATEGORY FILTER BAR */}
      {/* ================================================================== */}
      <CategoryFilterBar
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        equipmentCount={equipment.length}
      />

      {/* ================================================================== */}
      {/* MAP CONTAINER */}
      {/* ================================================================== */}
      <div className="flex-1 relative overflow-hidden">
        {/* Error State */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-peak-burgundy/10 border border-peak-burgundy/30 text-peak-burgundy px-4 py-2 rounded-peak text-sm">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-peak-cream/80 backdrop-blur-sm z-20">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-peak-forest/10 flex items-center justify-center mx-auto mb-3 animate-pulse">
                <span className="text-2xl">🔍</span>
              </div>
              <p className="text-peak-charcoal font-medium">Finding equipment...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && equipment.length === 0 && <EmptyState />}

        {/* Map */}
        <PeakMap
          equipment={equipment}
          onPinClick={handlePinClick}
          showFilters={false} // We have our own filter bar
          className="w-full h-full"
        />

        {/* Selected Equipment Panel */}
        {selectedEquipment && (
          <SelectedEquipmentPanel
            equipment={selectedEquipment}
            onClose={handleClosePanel}
            onMessage={handleMessage}
          />
        )}

        {/* Equipment Count Badge */}
        {!isLoading && equipment.length > 0 && (
          <div className="absolute bottom-4 right-4 z-10 md:bottom-4 md:left-4 md:right-auto">
            <div className="bg-peak-snow/95 backdrop-blur-sm rounded-peak shadow-peak px-4 py-2 text-sm">
              <span className="text-peak-slate">Showing </span>
              <span className="font-semibold text-peak-forest">{equipment.length}</span>
              <span className="text-peak-slate"> items in your network</span>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* CUSTOM STYLES */}
      {/* ================================================================== */}
      <style jsx global>{`
        /* Hide scrollbar for category filter */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Ensure map takes full height */
        .peak-map-container {
          min-height: 100% !important;
        }

        /* Animation for panel entrance */
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .peak-animate-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
