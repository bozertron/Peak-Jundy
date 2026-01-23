"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { ContactCard } from "./ContactCard";
import { PeakInput } from "../ui/PeakInput";

interface Contact {
  id: string;
  contactId: string;
  metAt?: Date | string | null;
  notes?: string | null;
  contact: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl?: string | null;
    locationName?: string | null;
    bio?: string | null;
    flavor?: string | null;
    foundingMember?: boolean;
    memberSince?: Date | string;
  };
}

interface CardGalleryProps {
  contacts: Contact[];
  onRemove?: (id: string) => void;
  emptyMessage?: string;
}

type SortOption = "name" | "recent" | "location";

export function CardGallery({
  contacts,
  onRemove,
  emptyMessage = "No contacts in your collection yet.",
}: CardGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.contact.name?.toLowerCase().includes(query) ||
          c.contact.email.toLowerCase().includes(query) ||
          c.contact.locationName?.toLowerCase().includes(query) ||
          c.notes?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case "name":
        result.sort((a, b) =>
          (a.contact.name || "").localeCompare(b.contact.name || "")
        );
        break;
      case "recent":
        result.sort((a, b) => {
          const dateA = a.metAt ? new Date(a.metAt).getTime() : 0;
          const dateB = b.metAt ? new Date(b.metAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case "location":
        result.sort((a, b) =>
          (a.contact.locationName || "zzz").localeCompare(
            b.contact.locationName || "zzz"
          )
        );
        break;
    }

    return result;
  }, [contacts, searchQuery, sortBy]);

  // Empty state
  if (contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🃏</div>
        <h3 className="font-serif text-xl font-bold text-peak-charcoal mb-2">
          Your Card Collection
        </h3>
        <p className="text-peak-charcoal/60 max-w-md mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="w-full sm:w-64">
          <PeakInput
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftAddon={<span>🔍</span>}
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-peak-charcoal/60">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 text-sm border border-peak-charcoal/20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-peak-forest/50"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name</option>
              <option value="location">Location</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-peak-charcoal/20">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 text-sm ${
                viewMode === "grid"
                  ? "bg-peak-forest text-white"
                  : "bg-white text-peak-charcoal hover:bg-peak-cream"
              }`}
            >
              ▦
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-sm ${
                viewMode === "list"
                  ? "bg-peak-forest text-white"
                  : "bg-white text-peak-charcoal hover:bg-peak-cream"
              }`}
            >
              ≡
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-peak-charcoal/60">
        {filteredContacts.length} of {contacts.length} contacts
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      {/* Gallery */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onRemove={onRemove}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center gap-4 p-4 bg-white rounded-peak shadow-sm hover:shadow-peak transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-peak-cream flex items-center justify-center overflow-hidden flex-shrink-0">
                {contact.contact.avatarUrl ? (
                  <Image
                    src={contact.contact.avatarUrl}
                    alt={contact.contact.name || "Contact"}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl">👤</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-peak-charcoal truncate">
                    {contact.contact.name || "Anonymous"}
                  </h4>
                  {contact.contact.foundingMember && (
                    <span title="Founding Member">⛰️</span>
                  )}
                </div>
                {contact.contact.locationName && (
                  <p className="text-sm text-peak-charcoal/60 truncate">
                    📍 {contact.contact.locationName}
                  </p>
                )}
              </div>

              {contact.metAt && (
                <div className="text-xs text-peak-charcoal/50 hidden sm:block">
                  Met{" "}
                  {new Date(contact.metAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              )}

              <a
                href={`/profile/${contact.contact.id}`}
                className="px-3 py-1.5 text-sm bg-peak-forest text-white rounded-lg hover:bg-peak-forest/90 transition-colors"
              >
                View
              </a>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {filteredContacts.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-peak-charcoal/60">
            No contacts found matching &ldquo;{searchQuery}&rdquo;
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-2 text-sm text-peak-forest hover:underline"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}

export default CardGallery;
