"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/Search/SearchBar";
import EquipmentGrid from "@/components/Equipment/EquipmentGrid";
import { useSearch } from "@/lib/hooks";

export default function EquipmentSearch() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const category = (searchParams.get("category") || "").trim();
  const { results, loading, error, search, clear } = useSearch();

  useEffect(() => {
    if (!query) {
      clear();
      return;
    }

    if (category) {
      search({ query, category });
    } else {
      search({ query });
    }
  }, [query, category, search, clear]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Browse Equipment
        </h1>

        <div className="mb-8">
          <SearchBar />
        </div>

        {loading && (
          <p className="mb-4 text-sm text-gray-600">Searching...</p>
        )}
        {error && (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        )}

        <EquipmentGrid equipment={results} />
      </div>
    </div>
  );
}
