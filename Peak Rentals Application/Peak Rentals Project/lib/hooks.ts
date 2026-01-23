"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { Equipment } from "@/lib/types";

interface SearchParams {
  query: string;
  category?: string;
}

export function useEquipment(equipmentId: string) {
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEquipment() {
      try {
        const response = await fetch(`/api/equipment/${equipmentId}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setEquipment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchEquipment();
  }, [equipmentId]);

  return { equipment, loading, error };
}

export function useAuth() {
  const { data: session, status } = useSession();
  return {
    session,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };
}

export function useSearch() {
  const [results, setResults] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async ({ query, category }: SearchParams) => {
    const trimmedQuery = query.trim();
    const trimmedCategory = category?.trim();

    if (!trimmedQuery) {
      setError("Search query cannot be empty.");
      return;
    }

    if (trimmedQuery.length > 100) {
      setError("Search query must be 100 characters or fewer.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/equipment/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmedQuery,
          category: trimmedCategory || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Search failed");
      }

      setResults(Array.isArray(data?.results) ? data.results : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, setResults]);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
    setLoading(false);
  }, [setError, setLoading, setResults]);

  return { results, loading, error, search, clear };
}
