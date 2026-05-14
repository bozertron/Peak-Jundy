"use client";

import { useMemo } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface EquipmentPinData {
  id: string;
  title: string;
  category: string;
  dailyRate?: number;
  pricePerDay?: number;
}

export interface EquipmentPinProps {
  /** Equipment data to display */
  equipment: EquipmentPinData;
  /** Whether this pin is currently selected */
  isSelected?: boolean;
  /** Click handler for the pin */
  onClick?: () => void;
}

// ============================================================================
// CATEGORY CONFIGURATION
// ============================================================================

type CategoryType = "equipment" | "outdoor" | "specialty" | "default";

interface CategoryConfig {
  type: CategoryType;
  bgColor: string;
  borderColor: string;
  selectedBgColor: string;
  selectedBorderColor: string;
  glowColor: string;
  icon: string;
}

/**
 * Maps equipment categories to their visual configuration
 * - Equipment (brass): Heavy machinery, construction, tools
 * - Outdoor (forest): Recreation, camping, winter sports
 * - Specialty (burgundy): Premium, unique, specialty items
 */
const getCategoryConfig = (category: string): CategoryConfig => {
  const normalizedCategory = category.toLowerCase();

  // Equipment category - brass tones
  if (
    normalizedCategory.includes("telehandler") ||
    normalizedCategory.includes("heavy") ||
    normalizedCategory.includes("boom") ||
    normalizedCategory.includes("lift") ||
    normalizedCategory.includes("skid") ||
    normalizedCategory.includes("vehicle") ||
    normalizedCategory.includes("tool") ||
    normalizedCategory.includes("construction")
  ) {
    return {
      type: "equipment",
      bgColor: "bg-peak-brass",
      borderColor: "border-peak-brass/60",
      selectedBgColor: "bg-peak-brass",
      selectedBorderColor: "border-peak-brass",
      glowColor: "shadow-[0_0_20px_rgba(184,134,11,0.5)]",
      icon: getEquipmentIcon(normalizedCategory),
    };
  }

  // Outdoor category - forest tones
  if (
    normalizedCategory.includes("recreation") ||
    normalizedCategory.includes("camping") ||
    normalizedCategory.includes("winter") ||
    normalizedCategory.includes("sport") ||
    normalizedCategory.includes("ski") ||
    normalizedCategory.includes("snowboard") ||
    normalizedCategory.includes("outdoor") ||
    normalizedCategory.includes("water")
  ) {
    return {
      type: "outdoor",
      bgColor: "bg-peak-forest",
      borderColor: "border-peak-forest/60",
      selectedBgColor: "bg-peak-forest",
      selectedBorderColor: "border-peak-forest",
      glowColor: "shadow-[0_0_20px_rgba(45,90,71,0.5)]",
      icon: getOutdoorIcon(normalizedCategory),
    };
  }

  // Specialty category - burgundy tones
  if (
    normalizedCategory.includes("special") ||
    normalizedCategory.includes("premium") ||
    normalizedCategory.includes("luxury") ||
    normalizedCategory.includes("rare") ||
    normalizedCategory.includes("unique")
  ) {
    return {
      type: "specialty",
      bgColor: "bg-peak-burgundy",
      borderColor: "border-peak-burgundy/60",
      selectedBgColor: "bg-peak-burgundy",
      selectedBorderColor: "border-peak-burgundy",
      glowColor: "shadow-[0_0_20px_rgba(114,47,55,0.5)]",
      icon: "star",
    };
  }

  // Default fallback - brass (equipment is the most common)
  return {
    type: "default",
    bgColor: "bg-peak-brass",
    borderColor: "border-peak-stone",
    selectedBgColor: "bg-peak-brass",
    selectedBorderColor: "border-peak-brass",
    glowColor: "shadow-[0_0_20px_rgba(184,134,11,0.4)]",
    icon: "package",
  };
};

const getEquipmentIcon = (category: string): string => {
  if (category.includes("telehandler") || category.includes("construction")) return "crane";
  if (category.includes("boom") || category.includes("lift")) return "arrow-up";
  if (category.includes("skid")) return "tractor";
  if (category.includes("vehicle")) return "truck";
  if (category.includes("tool")) return "wrench";
  return "package";
};

const getOutdoorIcon = (category: string): string => {
  if (category.includes("ski") || category.includes("winter") || category.includes("snow")) return "snowflake";
  if (category.includes("camping")) return "tent";
  if (category.includes("water")) return "waves";
  return "mountain";
};

// ============================================================================
// SVG ICON COMPONENTS
// ============================================================================

interface IconProps {
  className?: string;
}

const icons: Record<string, React.FC<IconProps>> = {
  crane: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20" />
      <path d="M2 10h10" />
      <path d="M17 10h5" />
      <path d="M19 7v6" />
      <path d="M7 14h10" />
    </svg>
  ),
  "arrow-up": ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  ),
  tractor: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="4" />
      <path d="M9 17h6" />
      <path d="M5 17v-5h4l3-4h6v9" />
    </svg>
  ),
  truck: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17h4V5H2v12h3" />
      <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  ),
  wrench: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  snowflake: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
    </svg>
  ),
  tent: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 22h20L12 2z" />
      <path d="M12 22V9" />
      <path d="M8 22l4-13 4 13" />
    </svg>
  ),
  waves: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    </svg>
  ),
  mountain: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3l4 8 5-5 5 15H2L8 3z" />
    </svg>
  ),
  star: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  package: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4l-9-5.19" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * EquipmentPin - A custom map marker component following the PEAK aesthetic system
 *
 * Features:
 * - Category-based colors (brass/forest/burgundy)
 * - Teardrop/marker SVG shape
 * - Hover state with subtle lift
 * - Selected state with glow effect
 * - Responsive to equipment type
 *
 * @example
 * ```tsx
 * <EquipmentPin
 *   equipment={item}
 *   isSelected={selectedId === item.id}
 *   onClick={() => handlePinClick(item)}
 * />
 * ```
 */
export function EquipmentPin({
  equipment,
  isSelected = false,
  onClick,
}: EquipmentPinProps) {
  // Memoize category configuration to prevent recalculation
  const config = useMemo(
    () => getCategoryConfig(equipment.category),
    [equipment.category]
  );

  // Get the appropriate icon component
  const IconComponent = (icons[config.icon] ?? icons.package)!;

  // Get price for display (support both naming conventions)
  const price = equipment.dailyRate ?? equipment.pricePerDay;

  return (
    <button
      onClick={onClick}
      aria-label={`${equipment.title} - ${equipment.category}${price ? ` - $${price}/day` : ""}`}
      className={`
        group relative flex flex-col items-center
        focus:outline-none focus:ring-2 focus:ring-peak-brass/50 focus:ring-offset-2
        transition-transform duration-200 ease-out
        ${isSelected ? "z-20 scale-110" : "z-10 hover:scale-105 hover:-translate-y-1"}
      `}
    >
      {/* Pin Container with Teardrop Shape */}
      <div
        className={`
          relative w-10 h-10 rounded-full
          flex items-center justify-center
          border-2 transition-all duration-200 ease-out
          ${isSelected
            ? `${config.selectedBgColor} ${config.selectedBorderColor} ${config.glowColor}`
            : `bg-peak-snow ${config.borderColor} shadow-peak hover:shadow-peak-lift`
          }
        `}
      >
        {/* Icon */}
        <IconComponent
          className={`
            w-5 h-5 transition-colors duration-200
            ${isSelected ? "text-white" : "text-peak-charcoal"}
          `}
        />

        {/* Inner highlight for depth (non-selected state) */}
        {!isSelected && (
          <div className="absolute inset-0.5 rounded-full bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
        )}

        {/* Brass ring accent for selected state */}
        {isSelected && (
          <div className="absolute -inset-1 rounded-full border border-peak-brass/30 animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Teardrop Tail / Pin Point */}
      <div
        className={`
          relative -mt-1 w-3 h-3 rotate-45
          border-r-2 border-b-2 transition-all duration-200
          ${isSelected
            ? `${config.selectedBgColor} ${config.selectedBorderColor}`
            : `bg-peak-snow ${config.borderColor}`
          }
        `}
      >
        {/* Shadow beneath the tail for depth */}
        <div
          className={`
            absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 rounded-full blur-sm
            transition-opacity duration-200
            ${isSelected ? "bg-black/20 opacity-100" : "bg-black/10 opacity-50 group-hover:opacity-75"}
          `}
        />
      </div>

      {/* Drop Shadow */}
      <div
        className={`
          absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full blur-sm
          transition-all duration-200
          ${isSelected
            ? "bg-black/25 w-5"
            : "bg-black/15 group-hover:bg-black/20 group-hover:w-5"
          }
        `}
      />

      {/* Price Badge (optional, shown on hover or when selected) */}
      {price && (
        <div
          className={`
            absolute -top-8 left-1/2 -translate-x-1/2
            px-2 py-0.5 rounded-lg
            text-xs font-semibold whitespace-nowrap
            transition-all duration-200
            ${isSelected
              ? "opacity-100 bg-peak-charcoal text-white shadow-peak"
              : "opacity-0 group-hover:opacity-100 bg-peak-snow text-peak-charcoal shadow-peak border border-peak-stone"
            }
          `}
        >
          ${price}
          <span className="text-peak-slate font-normal">/day</span>
        </div>
      )}
    </button>
  );
}

// ============================================================================
// ALTERNATE COMPACT PIN (for clustered views)
// ============================================================================

export interface CompactPinProps {
  count: number;
  category?: string;
  onClick?: () => void;
}

/**
 * CompactPin - A smaller pin variant for clustered markers
 */
export function CompactPin({ count, category, onClick }: CompactPinProps) {
  const config = category ? getCategoryConfig(category) : getCategoryConfig("default");

  return (
    <button
      onClick={onClick}
      aria-label={`Cluster of ${count} items`}
      className={`
        relative w-8 h-8 rounded-full
        ${config.bgColor}
        flex items-center justify-center
        text-white text-xs font-bold
        shadow-peak hover:shadow-peak-lift
        transition-all duration-200
        hover:scale-110
        focus:outline-none focus:ring-2 focus:ring-peak-brass/50 focus:ring-offset-2
      `}
    >
      {count}
      {/* Teardrop tail */}
      <div
        className={`
          absolute -bottom-1 left-1/2 -translate-x-1/2
          w-2 h-2 rotate-45
          ${config.bgColor}
        `}
      />
    </button>
  );
}

export default EquipmentPin;
