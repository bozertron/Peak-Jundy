"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EQUIPMENT_CATEGORIES } from "@/lib/categories";

interface Props {
  initialQuery?: string;
  initialCategory?: string;
  size?: "lg" | "md";
}

export default function SearchBar({
  initialQuery = "",
  initialCategory = "",
  size = "lg",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery || searchParams.get("q") || "");
  const [category, setCategory] = useState(
    initialCategory || searchParams.get("category") || ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const suggestions = [
    "Telehandler 10k",
    "Boom lift 60ft",
    "Scissor lift electric",
    "Skid steer tracks",
    "ICF bracing",
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    const trimmedCategory = category.trim();

    if (trimmedQuery.length > 100) {
      setError("Whoa — search term too long. Keep it under 100 characters.");
      return;
    }

    const params = new URLSearchParams();
    if (trimmedQuery) params.set("q", trimmedQuery);
    if (trimmedCategory) params.set("category", trimmedCategory);

    setError(null);
    startTransition(() => {
      router.push(params.toString() ? `/browse?${params.toString()}` : "/browse");
    });
  };

  const inputBase =
    size === "lg" ? "px-4 py-3 text-base" : "px-3 py-2 text-sm";

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="flex flex-col md:flex-row gap-2 md:gap-3">
        <input
          type="text"
          placeholder="What are you looking for? (telehandler, boom lift, skid steer…)"
          value={query}
          list="equipment-search-suggestions"
          onChange={(e) => {
            setQuery(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={Boolean(error)}
          aria-label="Search equipment"
          className={`flex-1 ${inputBase} font-sans rounded-peak bg-peak-snow border border-peak-stone text-peak-charcoal placeholder:text-peak-slate focus:outline-none focus:ring-2 focus:ring-peak-forest-500 focus:ring-offset-1 transition-all duration-200`}
        />
        <datalist id="equipment-search-suggestions">
          {[...EQUIPMENT_CATEGORIES, ...suggestions].map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
          className={`${inputBase} font-sans rounded-peak bg-peak-snow border border-peak-stone text-peak-charcoal focus:outline-none focus:ring-2 focus:ring-peak-forest-500 focus:ring-offset-1 transition-all duration-200`}
        >
          <option value="">All categories</option>
          {EQUIPMENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={isPending}
          className={`${inputBase} font-medium rounded-peak bg-peak-forest text-white hover:bg-peak-forest/90 disabled:opacity-50 transition-colors`}
        >
          {isPending ? "Searching…" : "Search"}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-peak-burgundy" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
