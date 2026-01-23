"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CardGallery, CardContact } from "@/components/cards/CardGallery";
import { PeakButton } from "@/components/ui/PeakButton";
import { PeakCard } from "@/components/ui/PeakCard";

/**
 * My Network - Contact Cards Collection Page
 *
 * PEAK AESTHETIC Implementation:
 * - Cream background (bg-peak-cream)
 * - Forest green accents (text-peak-forest, bg-peak-forest)
 * - Serif fonts for headings (font-serif)
 * - Sophisticated shadows and hover states
 * - Wood accent decorative elements
 */

export default function CardsPage() {
  const { data: session, status } = useSession();
  const [cards, setCards] = useState<CardContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cards from API
  useEffect(() => {
    const fetchCards = async () => {
      if (status !== "authenticated") return;

      try {
        setIsLoading(true);
        const response = await fetch("/api/cards");

        if (!response.ok) {
          throw new Error("Failed to fetch your network");
        }

        const data = await response.json();
        setCards(data.cards || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchCards();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [status]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalCards = cards.length;
    const foundingMembers = cards.filter((c) => c.contact.foundingMember).length;
    const uniqueLocations = new Set(
      cards.map((c) => c.contact.locationName).filter(Boolean)
    ).size;
    const uniqueFlavors = new Set(
      cards.map((c) => c.contact.flavor).filter(Boolean)
    ).size;

    return { totalCards, foundingMembers, uniqueLocations, uniqueFlavors };
  }, [cards]);

  // Handle card removal
  const handleRemoveCard = async (cardId: string) => {
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove card");
      }

      setCards((prev) => prev.filter((c) => c.id !== cardId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove card");
    }
  };

  // Unauthenticated state
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-peak-cream flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          {/* Decorative card stack illustration */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute w-16 h-20 bg-peak-stone/40 rounded-lg transform -rotate-12 left-2 top-2" />
            <div className="absolute w-16 h-20 bg-peak-stone/60 rounded-lg transform rotate-6 right-2 top-0" />
            <div className="absolute w-16 h-20 bg-peak-snow rounded-lg shadow-peak left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center border border-peak-stone">
              <svg className="w-8 h-8 text-peak-forest/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>

          <h1 className="font-serif text-3xl font-bold text-peak-charcoal mb-4">
            My Network
          </h1>
          <p className="text-peak-slate mb-6 leading-relaxed">
            Sign in to view your contact card collection and connect with trusted members of the Peak community.
          </p>

          {/* Wood accent */}
          <div className="peak-wood-accent w-16 mx-auto mb-6" />

          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-peak-forest text-white font-medium rounded-peak hover:bg-peak-forest/90 transition-all shadow-peak hover:shadow-peak-lift hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Loading state (session loading)
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-peak-cream flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-peak-charcoal">
            <svg className="w-5 h-5 animate-spin text-peak-forest" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="font-medium">Loading your network...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-peak-cream">
      {/* Header Navigation */}
      <header className="bg-white border-b border-peak-stone/50 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl transition-transform group-hover:scale-110">
                <svg className="w-8 h-8 text-peak-forest" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2zm0 2.5L18.5 11H17v7h-4v-6H11v6H7v-7H5.5L12 4.5z"/>
                </svg>
              </span>
              <h1 className="font-serif text-xl font-bold text-peak-charcoal">Peak</h1>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden sm:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-peak-slate hover:text-peak-charcoal transition-colors"
            >
              Home
            </Link>
            <Link
              href="/map"
              className="text-sm text-peak-slate hover:text-peak-charcoal transition-colors"
            >
              Map
            </Link>
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
          </nav>

          {/* Mobile menu button */}
          <button className="sm:hidden p-2 text-peak-charcoal hover:bg-peak-cream rounded-peak transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            {/* Back link */}
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-peak-forest hover:text-peak-forest/80 transition-colors mb-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>

            {/* Title - Serif Font */}
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-peak-charcoal">
              My Network
            </h1>
            <p className="text-peak-slate mt-2 max-w-lg">
              Your collection of trusted connections in the Peak community. Each card represents a vouched relationship.
            </p>
          </div>

          {/* Vouch CTA */}
          <Link href="/network">
            <PeakButton
              variant="primary"
              size="lg"
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              }
            >
              Vouch New Member
            </PeakButton>
          </Link>
        </div>

        {/* Wood Accent Divider */}
        <div className="peak-wood-accent w-24 mb-8" />

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Total Cards */}
          <PeakCard variant="elevated" padding="md" className="text-center">
            <div className="text-3xl font-bold text-peak-charcoal mb-1">
              {isLoading ? (
                <span className="inline-block w-8 h-8 bg-peak-stone/50 rounded animate-pulse" />
              ) : (
                stats.totalCards
              )}
            </div>
            <div className="text-sm text-peak-slate font-medium">Total Cards</div>
          </PeakCard>

          {/* Founding Members */}
          <PeakCard variant="elevated" padding="md" className="text-center">
            <div className="text-3xl font-bold text-peak-forest mb-1">
              {isLoading ? (
                <span className="inline-block w-8 h-8 bg-peak-stone/50 rounded animate-pulse" />
              ) : (
                stats.foundingMembers
              )}
            </div>
            <div className="text-sm text-peak-slate font-medium flex items-center justify-center gap-1">
              <svg className="w-4 h-4 text-peak-brass" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Founding Members
            </div>
          </PeakCard>

          {/* Unique Locations */}
          <PeakCard variant="elevated" padding="md" className="text-center">
            <div className="text-3xl font-bold text-peak-charcoal mb-1">
              {isLoading ? (
                <span className="inline-block w-8 h-8 bg-peak-stone/50 rounded animate-pulse" />
              ) : (
                stats.uniqueLocations
              )}
            </div>
            <div className="text-sm text-peak-slate font-medium flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Locations
            </div>
          </PeakCard>

          {/* Unique Flavors/Categories */}
          <PeakCard variant="elevated" padding="md" className="text-center">
            <div className="text-3xl font-bold text-peak-charcoal mb-1">
              {isLoading ? (
                <span className="inline-block w-8 h-8 bg-peak-stone/50 rounded animate-pulse" />
              ) : (
                stats.uniqueFlavors
              )}
            </div>
            <div className="text-sm text-peak-slate font-medium flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Categories
            </div>
          </PeakCard>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-peak flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 transition-colors p-1"
              aria-label="Dismiss error"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Card Gallery */}
        <CardGallery
          cards={cards}
          isLoading={isLoading}
          emptyMessage="Your network is waiting to grow! Start by vouching for people you know and trust to begin building your contact card collection."
          onRemove={handleRemoveCard}
          className="shadow-peak-frame"
        />

        {/* Quick Actions Footer */}
        {!isLoading && cards.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/network">
              <PeakButton variant="outline" size="md">
                View Trust Network
              </PeakButton>
            </Link>
            <Link href="/browse">
              <PeakButton variant="ghost" size="md">
                Browse Equipment
              </PeakButton>
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-peak-stone/50 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-peak-forest" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z"/>
              </svg>
              <span className="font-serif font-bold text-peak-charcoal">Peak</span>
            </div>
            <p className="text-sm text-peak-slate">
              Building trusted communities through meaningful connections.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/about" className="text-sm text-peak-slate hover:text-peak-forest transition-colors">
                About
              </Link>
              <Link href="/help" className="text-sm text-peak-slate hover:text-peak-forest transition-colors">
                Help
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
