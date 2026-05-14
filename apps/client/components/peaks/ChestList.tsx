"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatPeaks } from "@/lib/peaks";

interface Chest {
  id: string;
  title: string;
  description: string;
  peaksCost: number;
  prizeType: string;
  prizeTypeLabel: string;
}

interface ChestListProps {
  chests: Chest[];
  balance: number;
}

const PRIZE_EMOJI: Record<string, string> = {
  discount: "🎟️",
  physical_item: "🧢",
  feature_unlock: "🔓",
  badge: "🏅",
};

export default function ChestList({ chests, balance }: ChestListProps) {
  const router = useRouter();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<Chest | null>(null);
  const [, startTransition] = useTransition();

  if (chests.length === 0) {
    return (
      <div className="peak-frame bg-white rounded-peak p-10 text-center">
        <div className="text-5xl mb-3" aria-hidden>
          📦
        </div>
        <p className="font-serif text-lg font-bold text-peak-charcoal mb-1">
          The shelves are bare.
        </p>
        <p className="text-sm text-peak-charcoal/60">
          No chests available right now. Check back — admins drop new ones
          regularly.
        </p>
      </div>
    );
  }

  async function claim(chest: Chest) {
    setClaimingId(chest.id);
    setError(null);

    try {
      const res = await fetch("/api/peaks/chest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chestId: chest.id }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          data?.error ||
            "Couldn't claim that chest. Try again, or refresh and see if someone beat you to it."
        );
        return;
      }

      setOpened(chest);

      // Refresh server data so the chest disappears + balance updates.
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error("[chest-claim]", err);
      setError("Network hiccup — couldn't claim. Try again.");
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {chests.map((chest) => {
          const canAfford = balance >= chest.peaksCost;
          const isClaiming = claimingId === chest.id;
          const emoji = PRIZE_EMOJI[chest.prizeType] ?? "📦";

          return (
            <div
              key={chest.id}
              className={`peak-frame bg-white rounded-peak p-5 flex flex-col transition-all ${
                canAfford ? "" : "opacity-70"
              }`}
            >
              <div className="text-4xl mb-3" aria-hidden>
                {emoji}
              </div>
              <p className="font-mono uppercase tracking-[0.15em] text-[10px] text-peak-slate mb-1">
                {chest.prizeTypeLabel}
              </p>
              <h3 className="font-serif text-lg font-bold text-peak-charcoal mb-2 leading-tight">
                {chest.title}
              </h3>
              <p className="text-sm text-peak-charcoal/70 mb-4 flex-1">
                {chest.description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-peak-charcoal/10">
                <div>
                  <p className="font-serif text-xl font-bold text-peak-forest">
                    {formatPeaks(chest.peaksCost)}
                  </p>
                  <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-peak-slate">
                    peaks
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => claim(chest)}
                  disabled={!canAfford || isClaiming || claimingId !== null}
                  className="px-4 py-2 rounded-peak bg-peak-forest text-white text-sm font-medium hover:bg-peak-forest/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isClaiming
                    ? "Claiming…"
                    : canAfford
                      ? "Claim"
                      : `Need ${chest.peaksCost - balance} more`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div
          className="mt-4 rounded-peak bg-peak-burgundy/5 border border-peak-burgundy/30 text-peak-burgundy p-3 text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Claim celebration modal */}
      {opened && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-peak-charcoal/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpened(null)}
        >
          <div
            className="peak-frame bg-white rounded-peak p-8 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-6xl mb-4" aria-hidden>
              {PRIZE_EMOJI[opened.prizeType] ?? "📦"}
            </div>
            <p className="font-mono uppercase tracking-[0.25em] text-xs text-peak-slate mb-2">
              Chest claimed
            </p>
            <h3 className="font-serif text-2xl font-bold text-peak-charcoal mb-3">
              {opened.title}
            </h3>
            <p className="text-peak-charcoal/70 mb-6">
              {opened.description}
            </p>
            <button
              type="button"
              onClick={() => setOpened(null)}
              className="w-full py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 transition-colors"
            >
              Onward
            </button>
          </div>
        </div>
      )}
    </>
  );
}
