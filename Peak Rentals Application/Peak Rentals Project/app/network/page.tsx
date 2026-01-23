"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { PeakCard } from "@/components/ui/PeakCard";
import { PeakButton } from "@/components/ui/PeakButton";
import { PeakInput } from "@/components/ui/PeakInput";

interface NetworkMember {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  flavor: string | null;
  latitude: number | null;
  longitude: number | null;
  memberSince: string;
  foundingMember: boolean;
  degree: number; // 1 = direct, 2 = extended
  introducedBy: string | null;
}

interface NetworkStats {
  direct: number;
  extended: number;
  total: number;
}

export default function NetworkPage() {
  const { data: session, status } = useSession();
  const [network, setNetwork] = useState<NetworkMember[]>([]);
  const [stats, setStats] = useState<NetworkStats>({ direct: 0, extended: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "direct" | "extended">("all");
  const [showVouchModal, setShowVouchModal] = useState(false);
  const [vouchEmail, setVouchEmail] = useState("");
  const [vouchNote, setVouchNote] = useState("");
  const [isVouching, setIsVouching] = useState(false);

  // Fetch network
  useEffect(() => {
    const fetchNetwork = async () => {
      if (status !== "authenticated") return;

      try {
        const res = await fetch("/api/trust/network");
        if (!res.ok) throw new Error("Failed to fetch network");
        
        const data = await res.json();
        setNetwork(data.network || []);
        setStats(data.stats || { direct: 0, extended: 0, total: 0 });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load network");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNetwork();
  }, [status]);

  // Handle vouch
  const handleVouch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vouchEmail.trim()) return;

    setIsVouching(true);
    setError(null);

    try {
      const res = await fetch("/api/trust/vouch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: vouchEmail, note: vouchNote || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to vouch");
      }

      // Refresh network
      const networkRes = await fetch("/api/trust/network");
      if (networkRes.ok) {
        const data = await networkRes.json();
        setNetwork(data.network || []);
        setStats(data.stats || { direct: 0, extended: 0, total: 0 });
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

  // Filter network
  const filteredNetwork = network.filter(member => {
    if (filter === "direct") return member.degree === 1;
    if (filter === "extended") return member.degree === 2;
    return true;
  });

  // Not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-peak-cream flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-5xl mb-4">🤝</div>
          <h1 className="font-serif text-3xl font-bold text-peak-charcoal mb-4">
            Trust Network
          </h1>
          <p className="text-peak-charcoal/70 mb-6">
            Sign in to view your trusted connections and discover new people.
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
        <div className="text-peak-charcoal font-medium">Loading your network...</div>
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
            <Link href="/map" className="text-sm text-peak-charcoal/70 hover:text-peak-charcoal transition-colors">
              Map
            </Link>
            <Link href="/cards" className="text-sm text-peak-charcoal/70 hover:text-peak-charcoal transition-colors">
              Cards
            </Link>
            <Link href="/dashboard" className="text-sm text-peak-charcoal/70 hover:text-peak-charcoal transition-colors">
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
              Your Network
            </h1>
            <p className="text-peak-charcoal/60 mt-1">
              People you trust and people they&apos;ve vouched for
            </p>
          </div>

          <PeakButton
            onClick={() => setShowVouchModal(true)}
            leftIcon={<span>🤝</span>}
          >
            Vouch for Someone
          </PeakButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <PeakCard
            variant="elevated"
            padding="md"
            className={`cursor-pointer transition-all ${filter === "all" ? "ring-2 ring-peak-forest" : ""}`}
            onClick={() => setFilter("all")}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-peak-charcoal">{stats.total}</div>
              <div className="text-sm text-peak-charcoal/60">Total Network</div>
            </div>
          </PeakCard>
          <PeakCard
            variant="elevated"
            padding="md"
            className={`cursor-pointer transition-all ${filter === "direct" ? "ring-2 ring-peak-forest" : ""}`}
            onClick={() => setFilter("direct")}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-peak-forest">{stats.direct}</div>
              <div className="text-sm text-peak-charcoal/60">Direct Connections</div>
            </div>
          </PeakCard>
          <PeakCard
            variant="elevated"
            padding="md"
            className={`cursor-pointer transition-all ${filter === "extended" ? "ring-2 ring-peak-forest" : ""}`}
            onClick={() => setFilter("extended")}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-peak-wood">{stats.extended}</div>
              <div className="text-sm text-peak-charcoal/60">Extended Network</div>
            </div>
          </PeakCard>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-peak-burgundy/10 border border-peak-burgundy/20 rounded-peak text-peak-burgundy">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
          </div>
        )}

        {/* Network Grid */}
        {filteredNetwork.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🌲</div>
            <h2 className="font-serif text-xl font-bold text-peak-charcoal mb-2">
              {filter === "all" ? "Your network is empty" : `No ${filter} connections`}
            </h2>
            <p className="text-peak-charcoal/60 mb-6 max-w-md mx-auto">
              Start building your trust network by vouching for people you know.
              When you vouch, you&apos;re telling your network that this person is trustworthy.
            </p>
            <PeakButton onClick={() => setShowVouchModal(true)}>
              Vouch for Your First Connection
            </PeakButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNetwork.map((member) => (
              <PeakCard key={member.id} variant="elevated" padding="none" className="overflow-hidden">
                {/* Degree indicator */}
                <div className={`h-1 ${member.degree === 1 ? "bg-peak-forest" : "bg-peak-wood"}`} />
                
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-peak-cream flex items-center justify-center overflow-hidden flex-shrink-0">
                      {member.avatarUrl ? (
                        <Image
                          src={member.avatarUrl}
                          alt={member.name || ""}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">
                          {member.name?.[0]?.toUpperCase() || "?"}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif font-bold text-peak-charcoal truncate">
                          {member.name || "Anonymous"}
                        </h3>
                        {member.foundingMember && (
                          <span className="text-xs" title="Founding Member">⛰️</span>
                        )}
                      </div>
                      
                      {member.flavor && (
                        <p className="text-xs text-peak-slate truncate">{member.flavor}</p>
                      )}

                      {member.introducedBy && (
                        <p className="text-xs text-peak-forest mt-1">
                          via {member.introducedBy}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/profile/${member.id}`}
                      className="flex-1 px-3 py-2 text-center text-xs font-medium bg-peak-cream text-peak-charcoal rounded-peak hover:bg-peak-cream/80 transition-colors"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </PeakCard>
            ))}
          </div>
        )}
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
                <PeakButton type="submit" isLoading={isVouching} className="flex-1">
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
