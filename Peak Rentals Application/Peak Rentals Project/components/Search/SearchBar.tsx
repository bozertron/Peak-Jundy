"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EQUIPMENT_CATEGORIES } from "@/lib/categories";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const suggestions = [
    ...EQUIPMENT_CATEGORIES,
    "Telehandler 10k",
    "Boom lift 60ft",
    "Scissor lift electric",
    "Skid steer tracks",
    "ICF bracing system",
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    const trimmedCategory = category.trim();

    if (!trimmedQuery) {
      setError("Enter a search term.");
      return;
    }

    if (trimmedQuery.length > 100) {
      setError("Search query must be 100 characters or fewer.");
      return;
    }

    const params = new URLSearchParams();
    if (trimmedQuery) params.set("q", trimmedQuery);
    if (trimmedCategory) params.set("category", trimmedCategory);

    setError(null);
    startTransition(() => {
      router.push(`/browse?${params.toString()}`);
    });
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search equipment (telehandler, boom lift...)"
          value={query}
          list="equipment-search-suggestions"
          onChange={(e) => {
            setQuery(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={Boolean(error)}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
        <datalist id="equipment-search-suggestions">
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
        >
          <option value="">All Categories</option>
          <option value="Telehandler">Telehandler</option>
          <option value="Boom Lift">Boom Lift</option>
          <option value="Skid Steer">Skid Steer</option>
          <option value="ICF Bracing">ICF Bracing</option>
        </select>

        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
