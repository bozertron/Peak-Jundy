"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Equipment } from "@prisma/client";
import { MessageOwnerButton } from "../chat/MessageOwnerButton";

interface EquipmentWithOwner extends Equipment {
  owner: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl?: string | null;
    locationName?: string | null;
  };
}

interface EquipmentPopupProps {
  equipment: EquipmentWithOwner;
  position: { x: number; y: number };
  onClose: () => void;
}

export function EquipmentPopup({ equipment, position, onClose }: EquipmentPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Calculate popup position to stay within viewport
  const style: React.CSSProperties = {
    position: "absolute",
    left: Math.min(position.x, window.innerWidth - 320),
    top: position.y + 20,
    zIndex: 50,
  };

  return (
    <div ref={popupRef} style={style} className="peak-animate-in">
      <div className="w-72 bg-white rounded-peak shadow-peak overflow-hidden peak-frame">
        {/* Equipment Image */}
        <div className="relative h-36 bg-peak-cream">
          {equipment.image ? (
            <Image
              src={equipment.image}
              alt={equipment.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">⛷️</span>
            </div>
          )}
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-peak-charcoal hover:bg-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category badge */}
          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-peak-forest/10 text-peak-forest rounded-full mb-2">
            {equipment.category}
          </span>

          {/* Title */}
          <h3 className="font-serif text-lg font-bold text-peak-charcoal mb-1 line-clamp-1">
            {equipment.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-peak-charcoal/70 mb-3 line-clamp-2">
            {equipment.description}
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-xl font-bold text-peak-forest">
              ${(equipment.dailyRate / 100).toFixed(0)}
            </span>
            <span className="text-sm text-peak-charcoal/60">/day</span>
          </div>

          {/* Owner info */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-peak-charcoal/10">
            <div className="w-8 h-8 rounded-full bg-peak-cream flex items-center justify-center overflow-hidden">
              {equipment.owner.avatarUrl ? (
                <Image
                  src={equipment.owner.avatarUrl}
                  alt={equipment.owner.name || "Owner"}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              ) : (
                <span className="text-sm">👤</span>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-peak-charcoal">
                {equipment.owner.name || "Anonymous"}
              </div>
              {equipment.owner.locationName && (
                <div className="text-xs text-peak-charcoal/60">
                  📍 {equipment.owner.locationName}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Link
              href={`/equipment/${equipment.id}`}
              className="flex-1 px-4 py-2 bg-peak-forest text-white text-center text-sm font-medium rounded-lg hover:bg-peak-forest/90 transition-colors"
            >
              View Details
            </Link>
            <div className="flex-1">
              <MessageOwnerButton
                ownerId={equipment.owner.id}
                ownerName={equipment.owner.name || "Owner"}
                equipmentId={equipment.id}
                equipmentTitle={equipment.title}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EquipmentPopup;
