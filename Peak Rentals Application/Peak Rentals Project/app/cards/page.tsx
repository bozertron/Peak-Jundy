"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CardGallery } from "@/components/cards/CardGallery";
import { PeakButton } from "@/components/ui/PeakButton";
import { PeakCard } from "@/components/ui/PeakCard";
import { PeakInput } from "@/components/ui/PeakInput";

interface ContactCard {
  id: string;
  contactId: string;
  metAt: string | null;
  notes: string | null;
  contact: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    locationName: string | null;
    bio: string | null;
    flavor: string | null;
    foundingMember: boolean;
    memberSince: string;
  };
}

export default function CardsPage() {
  const { data: session, status } = useSession();
  const [contacts, setContacts] = useState<ContactCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVouchModal, setShowVouchModal] = useState(false);
  const [vouchEmail, setVouchEmail] = useState("");
  const [vouchNote, setVouchNote] = useState("");
  const [isVouching, setIsVouching] = useState(false);

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      if (status !== "authenticated") return;

      try {
        const response = await fetch("/api/cards");
        if (!response.ok) throw new Error("Failed to fetch contacts");
        const data = await response.json();
        setContacts(data.cards || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [status]);

  // Handle vouch submission
  const handleVouch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vouchEmail.trim()) return;

    setIsVouching(true);
    try {
      const response = await fetch("/api/trust/vouch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: vouchEmail,
          note: vouchNote || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to vouch");
      }

      // Refresh contacts after successful vouch
      const contactsResponse = await fetch("/api/cards");
      if (contactsResponse.ok) {
        const data = await contactsResponse.json();
        setContacts(data.cards || []);
      }

      setVouchEmail("");
      setVouchNote("");
      setShowVouchModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to vouch");
    } finally {
      setIsVouching(false);
    }
  };

  // Not logged in
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-peak-cream flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-5xl mb-4">🃏</div>
          <h1 className="font-serif text-3xl font-bold text-peak-charcoal mb-4">
            Your Card Collection
          </h1>
          <p className="text-peak-charcoal/70 mb-6">
            Sign in to view and manage your contact cards from the Peak network.
          </p>
          <Link
            href="/auth/signin"
            className="inline-block px-6 py-3 bg-peak-forest text-white font-medium rounded-peak hover:bg-peak-forest/90 transition-colors shadow-peak"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Loading
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-peak-cream flex items-center justify-center">
        <div className="text-peak-charcoal font-medium">Loading your cards...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-peak-cream">
      {/* Header */}
      <header className="bg-white border-b border-peak-charcoal/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">⛰️</span>
              <h1 className="font-serif text-xl font-bold text-peak-charcoal">Peak</h1>
            </Link>
          </div>

          <nav className="flex items-center gap-4">
            <Link
              href="/map"
              className="text-sm text-peak-charcoal/70 hover:text-peak-charcoal transition-colors"
            >
              Map
            </Link>
            <Link
              href="/browse"
              className="text-sm text-peak-charcoal/70 hover:text-peak-charcoal transition-colors"
            >
              Browse
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-peak-charcoal/70 hover:text-peak-charcoal transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-peak-charcoal">
              Your Cards
            </h1>
            <p className="text-peak-charcoal/60 mt-1">
              People you&apos;ve connected with on Peak
            </p>
          </div>

          <PeakButton
            onClick={() => setShowVouchModal(true)}
            leftIcon={<span>🤝</span>}
          >
            Vouch for Someone
          </PeakButton>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <PeakCard variant="elevated" padding="md">
            <div className="text-center">
              <div className="text-2xl font-bold text-peak-charcoal">
                {contacts.length}
              </div>
              <div className="text-sm text-peak-charcoal/60">Total Cards</div>
            </div>
          </PeakCard>
          <PeakCard variant="elevated" padding="md">
            <div className="text-center">
              <div className="text-2xl font-bold text-peak-charcoal">
                {contacts.filter((c) => c.contact.foundingMember).length}
              </div>
              <div className="text-sm text-peak-charcoal/60">Founders</div>
            </div>
          </PeakCard>
          <PeakCard variant="elevated" padding="md">
            <div className="text-center">
              <div className="text-2xl font-bold text-peak-charcoal">
                {new Set(contacts.map((c) => c.contact.locationName).filter(Boolean)).size}
              </div>
              <div className="text-sm text-peak-charcoal/60">Locations</div>
            </div>
          </PeakCard>
          <PeakCard variant="elevated" padding="md">
            <div className="text-center">
              <div className="text-2xl font-bold text-peak-forest">
                {session?.user?.name?.[0] || "U"}
              </div>
              <div className="text-sm text-peak-charcoal/60">Your Initial</div>
            </div>
          </PeakCard>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-peak-burgundy/10 border border-peak-burgundy/20 rounded-peak text-peak-burgundy">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Card Gallery */}
        <CardGallery
          contacts={contacts}
          emptyMessage="Start building your network by vouching for people you know and trust."
        />
      </main>

      {/* Vouch Modal */}
      {showVouchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <PeakCard variant="elevated" padding="lg" className="w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-peak-charcoal">
                Vouch for Someone
              </h2>
              <button
                onClick={() => setShowVouchModal(false)}
                className="text-peak-charcoal/50 hover:text-peak-charcoal"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-peak-charcoal/70 mb-4">
              Vouching creates a trust connection. Only vouch for people you actually
              know and trust. Both of you will receive each other&apos;s contact cards.
            </p>

            <form onSubmit={handleVouch} className="space-y-4">
              <PeakInput
                label="Their Email"
                type="email"
                placeholder="friend@example.com"
                value={vouchEmail}
                onChange={(e) => setVouchEmail(e.target.value)}
                required
              />

              <PeakInput
                label="Note (optional)"
                placeholder="How do you know this person?"
                value={vouchNote}
                onChange={(e) => setVouchNote(e.target.value)}
              />

              <div className="flex gap-3 pt-2">
                <PeakButton
                  type="button"
                  variant="secondary"
                  onClick={() => setShowVouchModal(false)}
                  className="flex-1"
                >
                  Cancel
                </PeakButton>
                <PeakButton
                  type="submit"
                  isLoading={isVouching}
                  className="flex-1"
                >
                  Vouch
                </PeakButton>
              </div>
            </form>
          </PeakCard>
        </div>
      )}
    </div>
  );
}
