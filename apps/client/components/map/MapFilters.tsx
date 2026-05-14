"use client";

import { useState } from "react";
import { EQUIPMENT_CATEGORIES } from "@/lib/categories";

export interface FilterState {
  category: string;
  priceRange: [number, number];
  available: boolean;
}

interface MapFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export function MapFilters({ filters, onFilterChange }: MapFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCategoryChange = (category: string) => {
    onFilterChange({ ...filters, category });
  };

  const handlePriceChange = (value: number, index: 0 | 1) => {
    const newRange: [number, number] = [...filters.priceRange] as [number, number];
    newRange[index] = value;
    onFilterChange({ ...filters, priceRange: newRange });
  };

  const handleAvailableToggle = () => {
    onFilterChange({ ...filters, available: !filters.available });
  };

  const clearFilters = () => {
    onFilterChange({
      category: "",
      priceRange: [0, 500],
      available: true,
    });
  };

  const hasActiveFilters = filters.category !== "" || 
    filters.priceRange[0] > 0 || 
    filters.priceRange[1] < 500;

  return (
    <div className="bg-white rounded-peak shadow-peak overflow-hidden">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-3 w-full hover:bg-peak-cream/50 transition-colors"
      >
        <span className="text-lg">🎿</span>
        <span className="font-medium text-peak-charcoal">Filters</span>
        {hasActiveFilters && (
          <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-peak-forest text-white rounded-full">
            Active
          </span>
        )}
        <span className={`ml-2 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {/* Filter Panel */}
      {isExpanded && (
        <div className="p-4 border-t border-peak-charcoal/10 space-y-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-peak-charcoal mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-peak-charcoal/20 rounded-lg bg-white text-peak-charcoal focus:outline-none focus:ring-2 focus:ring-peak-forest/50"
            >
              <option value="">All Categories</option>
              {EQUIPMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-peak-charcoal mb-2">
              Price Range ($/day)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={filters.priceRange[1]}
                value={filters.priceRange[0]}
                onChange={(e) => handlePriceChange(Number(e.target.value), 0)}
                className="w-20 px-2 py-1 border border-peak-charcoal/20 rounded-lg text-center"
              />
              <span className="text-peak-charcoal/60">to</span>
              <input
                type="number"
                min={filters.priceRange[0]}
                max={1000}
                value={filters.priceRange[1]}
                onChange={(e) => handlePriceChange(Number(e.target.value), 1)}
                className="w-20 px-2 py-1 border border-peak-charcoal/20 rounded-lg text-center"
              />
            </div>
          </div>

          {/* Available Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-peak-charcoal">
              Only Available
            </label>
            <button
              onClick={handleAvailableToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                filters.available ? "bg-peak-forest" : "bg-peak-charcoal/20"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  filters.available ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm font-medium text-peak-burgundy hover:bg-peak-burgundy/10 rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default MapFilters;
