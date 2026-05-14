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
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/market-gaps?days=${days}`);
        const data = (await res.json()) as MarketGapsResponse | { error?: string };
        if (!res.ok) {
          throw new Error("error" in data && data.error ? data.error : "Failed to load market gaps");
        }
        if ("gaps" in data) {
          setGaps(data.gaps ?? []);
        } else {
          setGaps([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load market gaps");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [days]);

  const recommendations = useMemo(() => buildRecommendations(gaps), [gaps]);

  return (
    <div className="max-w-6xl mx-auto bg-white border rounded-lg p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Market Gap Analysis</h2>
          <p className="text-sm text-gray-600">Top unmet demand over the selected window.</p>
        </div>
        <select
          className="input-field"
          value={days}
          onChange={(e) => setDays(e.target.value)}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-600">Loading market gaps...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Queries</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {gaps.slice(0, 8).map((gap) => (
                <li key={gap.query} className="flex items-center justify-between">
                  <span className="truncate">{gap.query}</span>
                  <span className="text-xs text-gray-500">{gap._count.query}</span>
                </li>
              ))}
              {!gaps.length && <li className="text-gray-500">No gaps reported.</li>}
            </ul>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Recommended Listings
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {recommendations.map((rec) => (
                <li key={rec.label} className="flex items-center justify-between">
                  <span className="truncate">{rec.label}</span>
                  <span className="text-xs text-gray-500">{rec.count}</span>
                </li>
              ))}
              {!recommendations.length && (
                <li className="text-gray-500">No recommendations yet.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
