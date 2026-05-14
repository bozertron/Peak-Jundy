"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import type { FeatureCollection } from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";

// Set access token from environment
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Equipment item with location data for map display
 */
export interface MapEquipment {
  id: string;
  title: string;
  category: string;
  dailyRate: number;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  available?: boolean;
  owner: {
    id: string;
    name: string;
    avatarUrl?: string;
    flavor?: string;
  };
}

/**
 * Props for the PeakMap component
 */
export interface PeakMapProps {
  /** Array of equipment items to display on the map */
  equipment: MapEquipment[];
  /** Callback when a pin is clicked */
  onPinClick?: (equipment: MapEquipment) => void;
  /** Initial map center [longitude, latitude] */
  initialCenter?: [number, number];
  /** Initial zoom level (0-22) */
  initialZoom?: number;
  /** Show category filter controls */
  showFilters?: boolean;
  /** Custom class name for container */
  className?: string;
}

/**
 * Internal filter state
 */
interface FilterState {
  selectedCategory: string | null;
}

// ============================================================================
// CONSTANTS - PEAK AESTHETIC
// ============================================================================

// Big White / Vail area as default center
const DEFAULT_CENTER: [number, number] = [-106.8175, 39.1911];
const DEFAULT_ZOOM = 10;

// PEAK color palette for map elements
const PEAK_COLORS = {
  forest: "#2D5A47",
  forestLight: "#5d9d86",
  brass: "#B8860B",
  brassLight: "#D4A574",
  burgundy: "#722F37",
  cream: "#FAF7F2",
  charcoal: "#2C3E50",
  snow: "#FFFFFF",
  stone: "#E7E5E4",
};

// Category emoji mapping for pins
const CATEGORY_ICONS: Record<string, string> = {
  telehandler: "🏗️",
  "heavy-equipment": "🏗️",
  "boom-lift": "⬆️",
  "aerial-lift": "⬆️",
  "skid-steer": "🚜",
  vehicle: "🚗",
  tools: "🔧",
  recreation: "🎿",
  "winter-sports": "🎿",
  camping: "⛺",
  "water-sports": "🚣",
  default: "📦",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get category emoji for display
 */
function getCategoryEmoji(category: string): string {
  const key = category.toLowerCase().replace(/\s+/g, "-");
  return CATEGORY_ICONS[key] ?? CATEGORY_ICONS.default ?? "";
}

/**
 * Convert equipment array to GeoJSON FeatureCollection for clustering
 */
function equipmentToGeoJSON(equipment: MapEquipment[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: equipment
      .filter((item) => item.latitude && item.longitude)
      .map((item) => ({
        type: "Feature" as const,
        properties: {
          id: item.id,
          title: item.title,
          category: item.category,
          dailyRate: item.dailyRate,
          emoji: getCategoryEmoji(item.category),
          ownerName: item.owner.name,
          available: item.available ?? true,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [item.longitude, item.latitude],
        },
      })),
  };
}

/**
 * Extract unique categories from equipment
 */
function getUniqueCategories(equipment: MapEquipment[]): string[] {
  const categories = new Set(equipment.map((item) => item.category));
  return Array.from(categories).sort();
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PeakMap({
  equipment,
  onPinClick,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  showFilters = true,
  className = "",
}: PeakMapProps) {
  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // State
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ selectedCategory: null });
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);

  // Memoized filtered equipment
  const filteredEquipment = useMemo(() => {
    if (!filters.selectedCategory) return equipment;
    return equipment.filter((item) => item.category === filters.selectedCategory);
  }, [equipment, filters.selectedCategory]);

  // Memoized categories
  const categories = useMemo(() => getUniqueCategories(equipment), [equipment]);

  // ============================================================================
  // MAP INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map with PEAK-aesthetic light style
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11", // Light/cream theme
      center: initialCenter,
      zoom: initialZoom,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    mapRef.current = map;

    // Add minimal navigation controls (bottom-right per PEAK design)
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "bottom-right"
    );

    // Add attribution in subtle position
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left");

    // Disable scroll zoom until map is clicked (better UX)
    map.scrollZoom.disable();
    map.on("click", () => {
      map.scrollZoom.enable();
    });

    // Mark as loaded when style is ready
    map.on("load", () => {
      setIsMapLoaded(true);
    });

    // Cleanup
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialCenter, initialZoom]);

  // ============================================================================
  // CLUSTERING LAYER SETUP
  // ============================================================================

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const sourceId = "equipment-source";
    const clusterId = "clusters";
    const clusterCountId = "cluster-count";
    const unclusteredId = "unclustered-point";
    const unclusteredLabelId = "unclustered-label";

    // Remove existing layers and source if they exist
    if (map.getLayer(unclusteredLabelId)) map.removeLayer(unclusteredLabelId);
    if (map.getLayer(unclusteredId)) map.removeLayer(unclusteredId);
    if (map.getLayer(clusterCountId)) map.removeLayer(clusterCountId);
    if (map.getLayer(clusterId)) map.removeLayer(clusterId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    // Add GeoJSON source with clustering enabled
    map.addSource(sourceId, {
      type: "geojson",
      data: equipmentToGeoJSON(filteredEquipment),
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    // CLUSTER CIRCLES - Forest green gradient based on count
    map.addLayer({
      id: clusterId,
      type: "circle",
      source: sourceId,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          PEAK_COLORS.forestLight, // < 10 items
          10,
          PEAK_COLORS.forest, // 10-29 items
          30,
          PEAK_COLORS.charcoal, // 30+ items
        ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          20, // < 10 items
          10,
          25, // 10-29 items
          30,
          35, // 30+ items
        ],
        "circle-stroke-width": 3,
        "circle-stroke-color": PEAK_COLORS.brassLight,
      },
    });

    // CLUSTER COUNT LABELS
    map.addLayer({
      id: clusterCountId,
      type: "symbol",
      source: sourceId,
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 14,
      },
      paint: {
        "text-color": PEAK_COLORS.snow,
      },
    });

    // INDIVIDUAL PINS - Cream with brass border
    map.addLayer({
      id: unclusteredId,
      type: "circle",
      source: sourceId,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": PEAK_COLORS.snow,
        "circle-radius": 18,
        "circle-stroke-width": 2.5,
        "circle-stroke-color": PEAK_COLORS.brassLight,
      },
    });

    // INDIVIDUAL PIN EMOJI LABELS
    map.addLayer({
      id: unclusteredLabelId,
      type: "symbol",
      source: sourceId,
      filter: ["!", ["has", "point_count"]],
      layout: {
        "text-field": ["get", "emoji"],
        "text-size": 16,
        "text-allow-overlap": true,
      },
    });

    // ============================================================================
    // CLICK HANDLERS
    // ============================================================================

    // Click on cluster -> zoom in
    map.on("click", clusterId, (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [clusterId] });
      if (!features.length || !features[0]) return;

      const clusterId2 = features[0].properties?.cluster_id;
      const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;

      source.getClusterExpansionZoom(clusterId2, (err, zoom) => {
        if (err) return;
        const geometry = features[0]?.geometry;
        if (geometry && geometry.type === "Point") {
          map.easeTo({
            center: geometry.coordinates as [number, number],
            zoom: zoom ?? 14,
            duration: 500,
          });
        }
      });
    });

    // Click on individual pin -> show popup & callback
    map.on("click", unclusteredId, (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [unclusteredId] });
      if (!features.length || !features[0]) return;

      const feature = features[0];
      const props = feature.properties;
      const geometry = feature.geometry;

      if (geometry.type !== "Point" || !props) return;

      const coordinates = geometry.coordinates.slice() as [number, number];
      const equipmentId = props.id;

      // Find the full equipment object
      const selectedEquipment = equipment.find((item) => item.id === equipmentId);

      if (selectedEquipment && onPinClick) {
        onPinClick(selectedEquipment);
      }

      // Close any existing popup
      if (popupRef.current) {
        popupRef.current.remove();
      }

      // Create PEAK-styled popup
      const popupContent = `
        <div class="peak-map-popup">
          <div class="peak-wood-accent-mini"></div>
          <h4 class="popup-title">${props.title}</h4>
          <div class="popup-meta">
            <span class="popup-category">${props.category}</span>
            <span class="popup-price">$${props.dailyRate}/day</span>
          </div>
          <div class="popup-owner">by ${props.ownerName}</div>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
        offset: 25,
        className: "peak-popup",
      })
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map);

      popupRef.current = popup;

      // Pan to pin with offset for popup
      map.easeTo({
        center: coordinates,
        offset: [0, -50],
        duration: 400,
      });
    });

    // ============================================================================
    // HOVER EFFECTS
    // ============================================================================

    // Cluster hover
    map.on("mouseenter", clusterId, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", clusterId, () => {
      map.getCanvas().style.cursor = "";
    });

    // Individual pin hover
    map.on("mouseenter", unclusteredId, (e: mapboxgl.MapMouseEvent) => {
      map.getCanvas().style.cursor = "pointer";
      const features = map.queryRenderedFeatures(e.point, { layers: [unclusteredId] });
      if (features.length && features[0]) {
        setHoveredPinId(features[0].properties?.id || null);
        map.setPaintProperty(unclusteredId, "circle-stroke-color", PEAK_COLORS.forest);
        map.setPaintProperty(unclusteredId, "circle-radius", 22);
      }
    });

    map.on("mouseleave", unclusteredId, () => {
      map.getCanvas().style.cursor = "";
      setHoveredPinId(null);
      map.setPaintProperty(unclusteredId, "circle-stroke-color", PEAK_COLORS.brassLight);
      map.setPaintProperty(unclusteredId, "circle-radius", 18);
    });
  }, [filteredEquipment, isMapLoaded, equipment, onPinClick]);

  // ============================================================================
  // FILTER HANDLERS
  // ============================================================================

  const handleCategorySelect = useCallback((category: string | null) => {
    setFilters((prev) => ({ ...prev, selectedCategory: category }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ selectedCategory: null });
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`peak-map-container relative w-full h-full ${className}`}>
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ minHeight: "400px" }}
      />

      {/* Category Filter Bar */}
      {showFilters && categories.length > 0 && (
        <div className="absolute top-4 left-4 z-10 max-w-[calc(100%-2rem)]">
          <div className="bg-peak-snow rounded-peak shadow-peak p-2 flex gap-1 flex-wrap">
            {/* All button */}
            <button
              onClick={() => handleCategorySelect(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                filters.selectedCategory === null
                  ? "bg-peak-forest text-white shadow-sm"
                  : "text-peak-charcoal hover:bg-peak-stone/50"
              }`}
            >
              All ({equipment.length})
            </button>

            {/* Category buttons */}
            {categories.map((category) => {
              const count = equipment.filter((e) => e.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    filters.selectedCategory === category
                      ? "bg-peak-forest text-white shadow-sm"
                      : "text-peak-charcoal hover:bg-peak-stone/50"
                  }`}
                >
                  <span>{getCategoryEmoji(category)}</span>
                  <span>{category}</span>
                  <span className="text-xs opacity-70">({count})</span>
                </button>
              );
            })}

            {/* Clear filter button */}
            {filters.selectedCategory && (
              <button
                onClick={clearFilters}
                className="px-2 py-1.5 rounded-lg text-sm text-peak-burgundy hover:bg-peak-burgundy/10 transition-colors"
                title="Clear filter"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Equipment count indicator */}
      <div className="absolute bottom-20 left-4 z-10">
        <div className="bg-peak-snow/90 backdrop-blur-sm rounded-peak shadow-peak px-3 py-2 text-sm">
          <span className="text-peak-slate">Showing </span>
          <span className="font-semibold text-peak-forest">{filteredEquipment.length}</span>
          <span className="text-peak-slate"> items</span>
        </div>
      </div>

      {/* Loading overlay */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-peak-cream/90 backdrop-blur-sm z-20">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-peak-forest/10 flex items-center justify-center mx-auto mb-3 animate-pulse">
              <span className="text-2xl">⛰️</span>
            </div>
            <p className="text-peak-slate font-medium">Loading map...</p>
          </div>
        </div>
      )}

      {/* PEAK Map Styles */}
      <style jsx global>{`
        /* Map container border radius */
        .peak-map-container .mapboxgl-map {
          border-radius: 0.625rem;
        }

        /* Navigation controls styling */
        .mapboxgl-ctrl-group {
          background: ${PEAK_COLORS.snow} !important;
          border-radius: 0.625rem !important;
          box-shadow: 0 2px 8px -2px rgba(44, 62, 80, 0.08),
                      0 4px 16px -4px rgba(44, 62, 80, 0.12) !important;
          overflow: hidden;
        }

        .mapboxgl-ctrl-group button {
          width: 36px !important;
          height: 36px !important;
          border: none !important;
          background-color: ${PEAK_COLORS.snow} !important;
        }

        .mapboxgl-ctrl-group button:hover {
          background-color: ${PEAK_COLORS.cream} !important;
        }

        .mapboxgl-ctrl-group button + button {
          border-top: 1px solid ${PEAK_COLORS.stone} !important;
        }

        /* Popup styling - PEAK aesthetic */
        .peak-popup .mapboxgl-popup-content {
          background: ${PEAK_COLORS.snow};
          border-radius: 0.625rem;
          padding: 0;
          box-shadow: 0 4px 16px -4px rgba(44, 62, 80, 0.12),
                      0 8px 32px -8px rgba(44, 62, 80, 0.16);
          border: 1px solid rgba(184, 134, 11, 0.15);
          min-width: 200px;
        }

        .peak-popup .mapboxgl-popup-close-button {
          font-size: 18px;
          color: ${PEAK_COLORS.charcoal};
          padding: 8px 12px;
          right: 4px;
          top: 4px;
        }

        .peak-popup .mapboxgl-popup-close-button:hover {
          background: transparent;
          color: ${PEAK_COLORS.forest};
        }

        .peak-popup .mapboxgl-popup-tip {
          border-top-color: ${PEAK_COLORS.snow};
        }

        /* Popup content styling */
        .peak-map-popup {
          padding: 16px;
        }

        .peak-wood-accent-mini {
          height: 3px;
          width: 40px;
          background: linear-gradient(
            90deg,
            ${PEAK_COLORS.brassLight} 0%,
            ${PEAK_COLORS.brass} 50%,
            #5D4037 100%
          );
          border-radius: 2px;
          margin-bottom: 12px;
        }

        .popup-title {
          font-family: 'Libre Baskerville', Georgia, serif;
          font-size: 16px;
          font-weight: 400;
          color: ${PEAK_COLORS.charcoal};
          margin: 0 0 8px 0;
          line-height: 1.3;
        }

        .popup-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .popup-category {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748B;
        }

        .popup-price {
          font-weight: 600;
          color: ${PEAK_COLORS.forest};
          font-size: 14px;
        }

        .popup-owner {
          font-size: 12px;
          color: #64748B;
          padding-top: 8px;
          border-top: 1px solid ${PEAK_COLORS.stone};
        }

        /* Attribution styling */
        .mapboxgl-ctrl-attrib {
          background: rgba(255, 255, 255, 0.8) !important;
          font-size: 10px !important;
          border-radius: 4px !important;
        }

        /* Scale control */
        .mapboxgl-ctrl-scale {
          background: rgba(255, 255, 255, 0.8) !important;
          border-color: ${PEAK_COLORS.stone} !important;
          border-radius: 4px !important;
          font-size: 10px !important;
        }
      `}</style>
    </div>
  );
}

export default PeakMap;
