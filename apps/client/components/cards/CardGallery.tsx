"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { ContactCard } from "./ContactCard";
import { PeakInput } from "../ui/peak-input";
import type { ContactCardSubject } from "@/types/api";

/**
 * CardGallery - A gallery view for contact cards collection
 *
 * Features:
 * - Responsive grid layout (1 col mobile, 2 cols tablet, 3-4 cols desktop)
 * - Loading skeleton state
 * - Empty state with illustration
 * - Filter by flavor category
 * - Sort options (newest, alphabetical)
 * - Total cards count display
 * - PEAK aesthetic with cream background
 */

// A row in the gallery: a ContactCard row + the enriched subject the
// card UI knows how to render.
export interface CardContact {
  id: string;
  contactId: string;
  metAt?: Date | string | null;
  notes?: string | null;
  contact: ContactCardSubject;
}

export interface CardGalleryProps {
  cards: CardContact[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRemove?: (id: string) => void;
  className?: string;
}

type SortOption = "newest" | "alphabetical" | "oldest";

// Skeleton card component for loading state
function CardSkeleton() {
  return (
    <div className="w-64 h-80 bg-peak-snow rounded-peak shadow-peak overflow-hidden animate-pulse">
      {/* Header skeleton */}
      <div className="h-20 bg-peak-forest/20" />

      {/* Avatar skeleton */}
      <div className="relative -mt-10 flex justify-center">
        <div className="w-20 h-20 rounded-full bg-peak-stone" />
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-5 bg-peak-stone rounded w-3/4 mx-auto" />
        <div className="h-4 bg-peak-stone/60 rounded w-1/2 mx-auto" />
        <div className="h-3 bg-peak-stone/40 rounded w-2/3 mx-auto mt-4" />
        <div className="h-3 bg-peak-stone/40 rounded w-1/2 mx-auto" />
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 px-4">
      {/* Illustrated empty state */}
      <div className="relative w-32 h-32 mx-auto mb-6">
        {/* Card deck illustration */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Background cards */}
          <div
            className="absolute w-20 h-28 bg-peak-stone/30 rounded-lg transform -rotate-12 -translate-x-2"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          />
          <div
            className="absolute w-20 h-28 bg-peak-stone/50 rounded-lg transform rotate-6 translate-x-2"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          />
          {/* Main card */}
          <div
            className="relative w-20 h-28 bg-peak-snow rounded-lg flex flex-col items-center justify-center border border-peak-stone"
            style={{ boxShadow: 'var(--shadow-base)' }}
          >
            <div className="w-8 h-8 rounded-full bg-peak-forest/10 flex items-center justify-center mb-2">
              <svg
                className="w-4 h-4 text-peak-forest/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="w-10 h-1 bg-peak-stone rounded" />
            <div className="w-6 h-1 bg-peak-stone/60 rounded mt-1" />
          </div>
        </div>
      </div>

      <h3 className="font-serif text-xl font-bold text-peak-charcoal mb-2">
        Your Card Collection
      </h3>
      <p className="text-peak-slate max-w-md mx-auto leading-relaxed">
        {message}
      </p>

      {/* Decorative wood accent */}
      <div className="peak-wood-accent w-16 mx-auto mt-6" />
    </div>
  );
}

export function CardGallery({
  cards,
  isLoading = false,
  emptyMessage = "No contacts in your collection yet. Start vouching to collect contact cards!",
  onRemove,
  className = "",
}: CardGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [flavorFilter, setFlavorFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Extract unique flavors for filter dropdown
  const uniqueFlavors = useMemo(() => {
    const flavors = new Set<string>();
    cards.forEach((card) => {
      if (card.contact.flavor) {
        flavors.add(card.contact.flavor);
      }
    });
    return Array.from(flavors).sort();
  }, [cards]);

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    let result = [...cards];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.contact.name?.toLowerCase().includes(query) ||
          c.contact.locationName?.toLowerCase().includes(query) ||
          c.contact.flavor?.toLowerCase().includes(query) ||
          c.notes?.toLowerCase().includes(query)
      );
    }

    // Filter by flavor category
    if (flavorFilter !== "all") {
      result = result.filter((c) => c.contact.flavor === flavorFilter);
    }

    // Sort
    switch (sortBy) {
      case "alphabetical":
        result.sort((a, b) =>
          (a.contact.name || "").localeCompare(b.contact.name || "")
        );
        break;
      case "newest":
        result.sort((a, b) => {
          const dateA = a.metAt ? new Date(a.metAt).getTime() : 0;
          const dateB = b.metAt ? new Date(b.metAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case "oldest":
        result.sort((a, b) => {
          const dateA = a.metAt ? new Date(a.metAt).getTime() : 0;
          const dateB = b.metAt ? new Date(b.metAt).getTime() : 0;
          return dateA - dateB;
        });
        break;
    }

    return result;
  }, [cards, searchQuery, sortBy, flavorFilter]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-peak-cream rounded-peak p-6 ${className}`}>
        {/* Loading header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="h-10 w-64 bg-peak-stone/50 rounded-peak animate-pulse" />
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-peak-stone/50 rounded-peak animate-pulse" />
            <div className="h-10 w-32 bg-peak-stone/50 rounded-peak animate-pulse" />
          </div>
        </div>

        {/* Loading count */}
        <div className="h-4 w-40 bg-peak-stone/30 rounded mb-6 animate-pulse" />

        {/* Skeleton grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (cards.length === 0) {
    return (
      <div className={`bg-peak-cream rounded-peak ${className}`}>
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className={`bg-peak-cream rounded-peak p-6 ${className}`}>
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
        {/* Search */}
        <div className="w-full sm:w-64">
          <PeakInput
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Flavor Filter */}
          {uniqueFlavors.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-peak-slate">Flavor:</span>
              <select
                value={flavorFilter}
                onChange={(e) => setFlavorFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-peak-stone rounded-peak bg-peak-snow text-peak-charcoal focus:outline-none focus:ring-2 focus:ring-peak-forest/50 focus:border-peak-forest transition-colors"
              >
                <option value="all">All Flavors</option>
                {uniqueFlavors.map((flavor) => (
                  <option key={flavor} value={flavor}>
                    {flavor}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-peak-slate">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 text-sm border border-peak-stone rounded-peak bg-peak-snow text-peak-charcoal focus:outline-none focus:ring-2 focus:ring-peak-forest/50 focus:border-peak-forest transition-colors"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-peak overflow-hidden border border-peak-stone">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-sm transition-colors ${
                viewMode === "grid"
                  ? "bg-peak-forest text-white"
                  : "bg-peak-snow text-peak-charcoal hover:bg-peak-cream"
              }`}
              aria-label="Grid view"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 text-sm transition-colors ${
                viewMode === "list"
                  ? "bg-peak-forest text-white"
                  : "bg-peak-snow text-peak-charcoal hover:bg-peak-cream"
              }`}
              aria-label="List view"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm font-medium text-peak-charcoal">
          {filteredCards.length}
        </span>
        <span className="text-sm text-peak-slate">
          of {cards.length} cards
          {searchQuery && (
            <span className="italic"> matching &ldquo;{searchQuery}&rdquo;</span>
          )}
          {flavorFilter !== "all" && (
            <span className="italic"> in {flavorFilter}</span>
          )}
        </span>
      </div>

      {/* Gallery Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center peak-stagger">
          {filteredCards.map((card) => (
            <ContactCard
              key={card.id}
              contact={card.contact}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3 peak-stagger">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="flex items-center gap-4 p-4 bg-peak-snow rounded-peak shadow-peak-sm hover:shadow-peak transition-shadow group"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-peak-cream flex items-center justify-center overflow-hidden flex-shrink-0 border border-peak-stone">
                {card.contact.avatarUrl ? (
                  <Image
                    src={card.contact.avatarUrl}
                    alt={card.contact.name || "Contact"}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl text-peak-forest/50">
                    {card.contact.name?.charAt(0).toUpperCase() || "?"}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-serif font-medium text-peak-charcoal truncate">
                    {card.contact.name || "Anonymous"}
                  </h4>
                  {card.contact.foundingMember && (
                    <span
                      className="w-5 h-5 rounded-full bg-peak-brass flex items-center justify-center flex-shrink-0"
                      title="Founding Member"
                    >
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {card.contact.flavor && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-peak-forest/10 text-peak-forest">
                      {card.contact.flavor}
                    </span>
                  )}
                  {card.contact.locationName && (
                    <p className="text-xs text-peak-slate truncate">
                      {card.contact.locationName}
                    </p>
                  )}
                </div>
              </div>

              {/* Met date */}
              {card.metAt && (
                <div className="text-xs text-peak-slate hidden sm:block">
                  Met{" "}
                  {new Date(card.metAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              )}

              {/* View button */}
              <a
                href={`/profile/${card.contact.id}`}
                className="px-4 py-2 text-sm bg-peak-forest text-white rounded-peak hover:bg-peak-forest/90 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                View
              </a>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {filteredCards.length === 0 && (searchQuery || flavorFilter !== "all") && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-peak-stone/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-peak-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-peak-slate mb-4">
            No cards found
            {searchQuery && <span> matching &ldquo;{searchQuery}&rdquo;</span>}
            {flavorFilter !== "all" && <span> in {flavorFilter}</span>}
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setFlavorFilter("all");
            }}
            className="text-sm text-peak-forest hover:text-peak-forest/80 hover:underline transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

export default CardGallery;
