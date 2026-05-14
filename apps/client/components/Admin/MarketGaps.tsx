"use client";

import { useEffect, useMemo, useState } from "react";
import type { MarketGapsResponse, SearchLogAggregate } from "@/lib/types";
import { EQUIPMENT_CATEGORIES } from "@/lib/categories";

type Recommendation = {
  label: string;
  count: number;
};

function buildRecommendations(gaps: SearchLogAggregate[]): Recommendation[] {
  const categoryCounts = new Map<string, number>();

  gaps.forEach((gap) => {
    const lower = gap.query.toLowerCase();
    const matched = EQUIPMENT_CATEGORIES.find((category) =>
      lower.includes(category.toLowerCase())
    );

    if (matched) {
      categoryCounts.set(
        matched,
        (categoryCounts.get(matched) ?? 0) + gap._count.query
      );
    }
  });

  const recommendations = Array.from(categoryCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  if (recommendations.length > 0) {
    return recommendations.slice(0, 6);
  }

  return gaps
    .map((gap) => ({ label: gap.query, count: gap._count.query }))
    .slice(0, 6);
}

export default function MarketGaps() {
  const [days, setDays] = useState("30");
  const [gaps, setGaps] = useState<SearchLogAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/market-gaps?days=${days}`);
        const data = (await res.json()) as
          | MarketGapsResponse
          | { error?: string };
        if (!res.ok) {
          throw new Error(
            "error" in data && data.error ? data.error : "Couldn't load market gaps."
          );
        }
        if (!cancelled) {
          if ("gaps" in data) setGaps(data.gaps ?? []);
          else setGaps([]);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[market-gaps]", err);
          setError(
            err instanceof Error ? err.message : "Couldn't load market gaps."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [days]);

  const recommendations = useMemo(() => buildRecommendations(gaps), [gaps]);

  return (
    <div className="peak-frame bg-white rounded-peak p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-1">
            Market gaps
          </p>
          <h2 className="font-serif text-lg font-bold text-peak-charcoal">
            What people wanted but couldn&rsquo;t find
          </h2>
        </div>
        <select
          className="px-3 py-2 rounded-peak bg-peak-snow border border-peak-stone text-peak-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-peak-forest-500"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          aria-label="Window"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {error && (
        <div
          className="rounded-peak bg-peak-burgundy/5 border border-peak-burgundy/30 text-peak-burgundy p-3 text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-peak-charcoal/60">
          Reading the snow report…
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-peak border border-peak-charcoal/10 bg-peak-cream/30 p-4">
            <p className="font-mono uppercase tracking-[0.15em] text-[10px] text-peak-slate mb-3">
              Top queries
            </p>
            <ul className="space-y-2 text-sm text-peak-charcoal/80">
              {gaps.slice(0, 8).map((gap) => (
                <li key={gap.query} className="flex items-center justify-between">
                  <span className="truncate">{gap.query}</span>
                  <span className="text-xs text-peak-charcoal/50 font-mono">
                    {gap._count.query}
                  </span>
                </li>
              ))}
              {!gaps.length && (
                <li className="text-peak-charcoal/50">
                  Nothing to report this window. Either everyone&rsquo;s
                  finding what they need or no one&rsquo;s looking yet.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-peak border border-peak-charcoal/10 bg-peak-cream/30 p-4">
            <p className="font-mono uppercase tracking-[0.15em] text-[10px] text-peak-slate mb-3">
              Recommend to owners
            </p>
            <ul className="space-y-2 text-sm text-peak-charcoal/80">
              {recommendations.map((rec) => (
                <li key={rec.label} className="flex items-center justify-between">
                  <span className="truncate">{rec.label}</span>
                  <span className="text-xs text-peak-charcoal/50 font-mono">
                    {rec.count}
                  </span>
                </li>
              ))}
              {!recommendations.length && (
                <li className="text-peak-charcoal/50">No suggestions yet.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
