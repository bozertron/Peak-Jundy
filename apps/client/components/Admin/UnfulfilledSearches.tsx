"use client";

import { useEffect, useState } from "react";
import type {
  SearchLogAggregate,
  UnfulfilledSearchesResponse,
} from "@/lib/types";

export default function UnfulfilledSearches() {
  const [rows, setRows] = useState<SearchLogAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/analytics/unfulfilled-searches");
        if (!res.ok) throw new Error("Couldn't load unfulfilled searches.");
        const data = (await res.json()) as UnfulfilledSearchesResponse;
        if (!cancelled) setRows(data.topSearches ?? []);
      } catch (err) {
        if (!cancelled) {
          console.error("[unfulfilled-searches]", err);
          setError(err instanceof Error ? err.message : "Couldn't load.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="peak-frame bg-white rounded-peak p-5 text-sm text-peak-charcoal/60">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="peak-frame bg-white rounded-peak p-5 text-sm text-peak-burgundy">
        {error}
      </div>
    );
  }

  return (
    <div className="peak-frame bg-white rounded-peak overflow-hidden">
      <div className="px-5 py-4 border-b border-peak-charcoal/10">
        <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-1">
          Unfulfilled searches
        </p>
        <h2 className="font-serif text-lg font-bold text-peak-charcoal">
          Market intelligence
        </h2>
        <p className="text-xs text-peak-charcoal/60 mt-1">
          What renters search for and don&rsquo;t find.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-peak-cream/50 border-b border-peak-charcoal/10">
            <tr>
              <th className="px-5 py-3 text-left font-mono uppercase tracking-[0.15em] text-[10px] text-peak-slate">
                Query
              </th>
              <th className="px-5 py-3 text-left font-mono uppercase tracking-[0.15em] text-[10px] text-peak-slate">
                Count
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-peak-charcoal/5">
            {rows.map((r) => (
              <tr
                key={r.query}
                className="hover:bg-peak-cream/30 transition-colors"
              >
                <td className="px-5 py-3 text-sm text-peak-charcoal">
                  {r.query}
                </td>
                <td className="px-5 py-3 text-sm font-mono text-peak-charcoal/80">
                  {r._count.query}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td
                  className="px-5 py-6 text-sm text-peak-charcoal/60 text-center"
                  colSpan={2}
                >
                  Quiet on the search front. Nothing logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
