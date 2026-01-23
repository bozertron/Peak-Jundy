"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { EquipmentPopup } from "./EquipmentPopup";
import { MapFilters, FilterState } from "./MapFilters";
import { Equipment } from "@prisma/client";

// Set access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface EquipmentWithOwner extends Equipment {
  owner: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl?: string | null;
    locationName?: string | null;
  };
}

interface PeakMapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  onEquipmentSelect?: (equipment: EquipmentWithOwner) => void;
}

export function PeakMap({
  initialCenter = [-106.8175, 39.1911], // Vail, CO as default
  initialZoom = 10,
  onEquipmentSelect,
}: PeakMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [equipment, setEquipment] = useState<EquipmentWithOwner[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentWithOwner | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [filters, setFilters] = useState<FilterState>({
    category: "",
    priceRange: [0, 500],
    available: true,
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: initialCenter,
      zoom: initialZoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "top-right"
    );

    map.current.on("load", () => {
      setIsLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [initialCenter, initialZoom]);

  // Fetch equipment from trust network
  const fetchEquipment = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set("category", filters.category);

      const response = await fetch(`/api/trust/visible-equipment?${params}`);
      if (!response.ok) throw new Error("Failed to fetch equipment");
      
      const data = await response.json();
      setEquipment(data.equipment || []);
    } catch (error) {
      console.error("Error fetching equipment:", error);
    }
  }, [filters.category]);

  useEffect(() => {
    if (isLoaded) {
      fetchEquipment();
    }
  }, [isLoaded, fetchEquipment]);

  // Add markers for equipment
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Filter equipment by price
    const filteredEquipment = equipment.filter((item) => {
      const price = item.pricePerDay || 0;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // Add new markers
    filteredEquipment.forEach((item) => {
      if (!item.latitude || !item.longitude) return;

      // Create custom marker element
      const el = document.createElement("div");
      el.className = "peak-marker";
      el.innerHTML = `
        <div class="peak-marker-pin">
          <span class="peak-marker-price">$${item.pricePerDay || 0}</span>
        </div>
      `;
      el.style.cssText = `
        cursor: pointer;
        transition: transform 0.2s ease;
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([item.longitude, item.latitude])
        .addTo(map.current!);

      el.addEventListener("click", () => {
        // Get marker position on screen
        const lngLat = marker.getLngLat();
        const point = map.current!.project(lngLat);
        setPopupPosition({ x: point.x, y: point.y });
        setSelectedEquipment(item);
        onEquipmentSelect?.(item);
      });

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.1)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
      });

      markersRef.current.push(marker);
    });
  }, [equipment, isLoaded, filters.priceRange, onEquipmentSelect]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const closePopup = () => {
    setSelectedEquipment(null);
  };

  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
      <div ref={mapContainer} className="h-full w-full rounded-peak overflow-hidden" />

      {/* Filters Overlay */}
      <div className="absolute top-4 left-4 z-10">
        <MapFilters filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {/* Equipment Popup */}
      {selectedEquipment && (
        <EquipmentPopup
          equipment={selectedEquipment}
          position={popupPosition}
          onClose={closePopup}
        />
      )}

      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-peak-cream/80">
          <div className="text-peak-charcoal font-medium">Loading map...</div>
        </div>
      )}

      {/* Marker Styles */}
      <style jsx global>{`
        .peak-marker-pin {
          background: var(--peak-forest);
          color: white;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          position: relative;
        }
        .peak-marker-pin::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid var(--peak-forest);
        }
        .peak-marker-price {
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}

export default PeakMap;
