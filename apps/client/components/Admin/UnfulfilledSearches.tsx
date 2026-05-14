"use client";

import { useEffect, useState } from "react";
import type { SearchLogAggregate, UnfulfilledSearchesResponse } from "@/lib/types";

export default function UnfulfilledSearches() {
  const [rows, setRows] = useState<SearchLogAggregate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch("/api/analytics/unfulfilled-searches");
        const data = (await res.json()) as UnfulfilledSearchesResponse;
        setRows(data.topSearches ?? []);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, []);

  if (loading) return <div className="text-gray-600">Loading…</div>;

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-semibold">Unfulfilled Searches</h2>
        <p className="text-sm text-gray-600">Market intelligence: what renters want.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Query</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.query} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-sm text-gray-900">{r.query}</td>
                <td className="px-6 py-3 text-sm text-gray-700">{r._count.query}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="px-6 py-6 text-sm text-gray-600" colSpan={2}>
                  No unfulfilled searches yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
