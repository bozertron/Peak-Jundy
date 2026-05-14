"use client";

import { useEffect, useState } from "react";
import type {
  SearchLogAggregate,
  UnfulfilledSearchesResponse,
} from "@/lib/types";

const inputClass =
  "w-full px-3 py-2 rounded-peak bg-peak-snow border border-peak-stone text-peak-charcoal placeholder:text-peak-slate focus:outline-none focus:ring-2 focus:ring-peak-forest-500 focus:ring-offset-1 transition-all text-sm";

export default function AdminDashboard() {
  const [searchLogs, setSearchLogs] = useState<SearchLogAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    days: "30",
    minCount: "0",
    query: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("days", appliedFilters.days);
        if (appliedFilters.minCount)
          params.set("minCount", appliedFilters.minCount);
        if (appliedFilters.query) params.set("query", appliedFilters.query);

        const res = await fetch(
          `/api/analytics/unfulfilled-searches?${params.toString()}`
        );
        const data = (await res.json()) as
          | UnfulfilledSearchesResponse
          | { error?: string };
        if (!res.ok) {
          throw new Error(
            "error" in data && data.error ? data.error : "Failed to fetch analytics"
          );
        }
        if (!cancelled) {
          if ("topSearches" in data) {
            setSearchLogs(data.topSearches || []);
          } else {
            setSearchLogs([]);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[admin-analytics]", err);
          setError(
            err instanceof Error ? err.message : "Couldn't load analytics."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appliedFilters]);

  const topChart = searchLogs.slice(0, 10);
  const maxCount = topChart.reduce(
    (max, item) => Math.max(max, item._count.query),
    1
  );

  return (
    <div className="space-y-6">
      <div className="peak-frame bg-white rounded-peak p-6">
        <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
          Admin · analytics
        </p>
        <h1 className="font-serif text-2xl font-bold text-peak-charcoal">
          What people are searching for
        </h1>
        <p className="text-sm text-peak-charcoal/70 mt-2">
          Unfulfilled searches are where demand outpaces supply. Tell owners.
        </p>
      </div>

      <form
        className="peak-frame bg-white rounded-peak p-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedFilters(filters);
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block">
            <span className="font-mono uppercase tracking-[0.15em] text-[10px] text-peak-slate block mb-1.5">
              Date range
            </span>
            <select
              className={inputClass}
              value={filters.days}
              onChange={(e) =>
                setFilters({ ...filters, days: e.target.value })
              }
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </label>

          <label className="block">
            <span className="font-mono uppercase tracking-[0.15em] text-[10px] text-peak-slate block mb-1.5">
              Minimum count
            </span>
            <input
              className={inputClass}
              type="number"
              min="0"
              value={filters.minCount}
              onChange={(e) =>
                setFilters({ ...filters, minCount: e.target.value })
              }
              placeholder="0"
            />
          </label>

          <label className="block">
            <span className="font-mono uppercase tracking-[0.15em] text-[10px] text-peak-slate block mb-1.5">
              Query filter
            </span>
            <input
              className={inputClass}
              value={filters.query}
              onChange={(e) =>
                setFilters({ ...filters, query: e.target.value })
              }
              placeholder="e.g. telehandler"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-peak bg-peak-forest text-white text-sm font-medium hover:bg-peak-forest/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Applying…" : "Apply filters"}
          </button>
          <button
            type="button"
            onClick={() => {
              const reset = { days: "30", minCount: "0", query: "" };
              setFilters(reset);
              setAppliedFilters(reset);
            }}
            className="px-4 py-2 rounded-peak border border-peak-charcoal/15 text-sm text-peak-charcoal hover:bg-peak-cream transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      {error && (
        <div
          className="rounded-peak bg-peak-burgundy/5 border border-peak-burgundy/30 text-peak-burgundy p-4 text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="peak-frame bg-white rounded-peak overflow-hidden">
        <div className="px-5 py-4 border-b border-peak-charcoal/10">
          <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-1">
            Top demand
          </p>
          <h2 className="font-serif text-lg font-bold text-peak-charcoal">
            Most-searched terms in the window
          </h2>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-peak-charcoal/60">
            Loading the slope report…
          </div>
        ) : topChart.length === 0 ? (
          <div className="p-6 text-sm text-peak-charcoal/60 text-center">
            Quiet on the search front. No unfulfilled queries in this window.
          </div>
        ) : (
          <div className="p-5 space-y-2.5">
            {topChart.map((item) => {
              const pct = (item._count.query / maxCount) * 100;
              const priority =
                item._count.query > 100
                  ? { label: "high", color: "text-peak-burgundy", bg: "bg-peak-burgundy" }
                  : item._count.query > 50
                    ? { label: "medium", color: "text-peak-brass", bg: "bg-peak-brass" }
                    : { label: "low", color: "text-peak-forest", bg: "bg-peak-forest" };
              return (
                <div
                  key={item.query}
                  className="flex items-center gap-3 text-sm"
                >
                  <div className="w-36 truncate text-peak-charcoal/80">
                    {item.query}
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-peak-stone/30 overflow-hidden">
                    <div
                      className={`h-full ${priority.bg} rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-12 text-right font-mono text-peak-charcoal/70">
                    {item._count.query}
                  </div>
                  <div
                    className={`w-16 text-right text-xs font-medium ${priority.color}`}
                  >
                    {priority.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="px-5 py-3 border-t border-peak-charcoal/10 text-[11px] text-peak-charcoal/60">
          Priority thresholds: high &gt; 100, medium &gt; 50, low ≤ 50.
        </div>
      </div>
    </div>
  );
}
