"use client";

import { useEffect, useState } from "react";
import type { SearchLogAggregate, UnfulfilledSearchesResponse } from "@/lib/types";

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
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("days", appliedFilters.days);
        if (appliedFilters.minCount) params.set("minCount", appliedFilters.minCount);
        if (appliedFilters.query) params.set("query", appliedFilters.query);

        const res = await fetch(`/api/analytics/unfulfilled-searches?${params.toString()}`);
        const data = (await res.json()) as UnfulfilledSearchesResponse | { error?: string };
        if (!res.ok) {
          throw new Error("error" in data && data.error ? data.error : "Failed to fetch analytics");
        }
        if ("topSearches" in data) {
          setSearchLogs(data.topSearches || []);
        } else {
          setSearchLogs([]);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load analytics");
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [appliedFilters]);

  const topChart = searchLogs.slice(0, 10);
  const maxCount = topChart.reduce((max, item) => Math.max(max, item._count.query), 1);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Admin Analytics Dashboard</h1>

      <form
        className="bg-white border rounded-lg p-4 mb-6 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedFilters(filters);
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="text-sm font-medium">
            Date Range
            <select
              className="input-field w-full mt-2"
              value={filters.days}
              onChange={(e) => setFilters({ ...filters, days: e.target.value })}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Minimum Count
            <input
              className="input-field w-full mt-2"
              type="number"
              min="0"
              value={filters.minCount}
              onChange={(e) => setFilters({ ...filters, minCount: e.target.value })}
              placeholder="0"
            />
          </label>

          <label className="text-sm font-medium">
            Query Filter
            <input
              className="input-field w-full mt-2"
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              placeholder="e.g. telehandler"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Applying..." : "Apply Filters"}
          </button>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              const reset = { days: "30", minCount: "0", query: "" };
              setFilters(reset);
              setAppliedFilters(reset);
            }}
          >
            Reset
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div>Loading analytics...</div>
      ) : (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Top Search Demand</h2>
          {topChart.length ? (
            <div className="space-y-3">
              {topChart.map((item) => (
                <div key={item.query} className="flex items-center gap-3">
                  <div className="w-32 text-xs text-gray-600 truncate">{item.query}</div>
                  <div className="flex-1 bg-gray-100 rounded">
                    <div
                      className="h-2 rounded bg-blue-500"
                      style={{ width: `${(item._count.query / maxCount) * 100}%` }}
                    />
                  </div>
                  <div className="w-10 text-xs text-gray-500 text-right">
                    {item._count.query}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No data available for the selected filters.</p>
          )}
          <div className="mt-4 text-xs text-gray-500">
            Priority thresholds: High &gt; 100, Medium &gt; 50, Low ≤ 50
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Top Unfulfilled Searches</h2>
          <p className="text-gray-600 text-sm">
            Equipment renters are searching for but not finding
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Search Query
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Priority
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {searchLogs.map((log) => (
                <tr key={log.query} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {log.query}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log._count.query}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        log._count.query > 100
                          ? "bg-red-100 text-red-800"
                          : log._count.query > 50
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {log._count.query > 100
                        ? "High"
                        : log._count.query > 50
                        ? "Medium"
                        : "Low"}
                    </span>
                  </td>
                </tr>
              ))}
              {!searchLogs.length && (
                <tr>
                  <td className="px-6 py-6 text-sm text-gray-600" colSpan={3}>
                    No unfulfilled searches yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
