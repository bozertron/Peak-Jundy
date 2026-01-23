"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageOwnerButton } from "../chat/MessageOwnerButton";

interface OwnerCardProps {
  owner: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl?: string | null;
    locationName?: string | null;
    bio?: string | null;
    memberSince?: Date | string;
    foundingMember?: boolean;
    peaksBalance?: number;
    flavor?: string | null;
  };
  equipmentCount?: number;
  vouchCount?: number;
  compact?: boolean;
  className?: string;
}

export function OwnerCard({
  owner,
  equipmentCount = 0,
  vouchCount = 0,
  compact = false,
  className = "",
}: OwnerCardProps) {
  const memberDate = owner.memberSince 
    ? new Date(owner.memberSince).toLocaleDateString("en-US", { 
        month: "short", 
        year: "numeric" 
      })
    : null;

  // Compact version for map popups and lists
  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="w-10 h-10 rounded-full bg-peak-cream flex items-center justify-center overflow-hidden flex-shrink-0">
          {owner.avatarUrl ? (
            <Image
              src={owner.avatarUrl}
              alt={owner.name || "Owner"}
              width={40}
              height={40}
              className="object-cover"
            />
          ) : (
            <span className="text-lg">👤</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-medium text-peak-charcoal truncate">
              {owner.name || "Anonymous"}
            </span>
            {owner.foundingMember && (
              <span title="Founding Member">⛰️</span>
            )}
          </div>
          {owner.locationName && (
            <div className="text-xs text-peak-charcoal/60 truncate">
              📍 {owner.locationName}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full version for profile pages
  return (
    <div className={`bg-white rounded-peak shadow-peak overflow-hidden peak-frame ${className}`}>
      {/* Header with avatar */}
      <div className="relative h-24 bg-gradient-to-br from-peak-forest to-peak-forest/80">
        <div className="absolute -bottom-8 left-4">
          <div className="w-16 h-16 rounded-full bg-white p-1 shadow-lg">
            <div className="w-full h-full rounded-full bg-peak-cream flex items-center justify-center overflow-hidden">
              {owner.avatarUrl ? (
                <Image
                  src={owner.avatarUrl}
                  alt={owner.name || "Owner"}
                  width={60}
                  height={60}
                  className="object-cover"
                />
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Founding member badge */}
        {owner.foundingMember && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-peak-gold/90 text-peak-charcoal text-xs font-medium rounded-full flex items-center gap-1">
            <span>⛰️</span>
            Founding Member
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pt-10 p-4">
        {/* Name and flavor */}
        <div className="mb-2">
          <h3 className="font-serif text-xl font-bold text-peak-charcoal">
            {owner.name || "Anonymous"}
          </h3>
          {owner.flavor && (
            <p className="text-sm text-peak-forest italic">&ldquo;{owner.flavor}&rdquo;</p>
          )}
        </div>

        {/* Location */}
        {owner.locationName && (
          <div className="text-sm text-peak-charcoal/70 mb-3">
            📍 {owner.locationName}
          </div>
        )}

        {/* Bio */}
        {owner.bio && (
          <p className="text-sm text-peak-charcoal/80 mb-4 line-clamp-3">
            {owner.bio}
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-4 mb-4 py-3 border-y border-peak-charcoal/10">
          <div className="text-center">
            <div className="font-bold text-peak-charcoal">{equipmentCount}</div>
            <div className="text-xs text-peak-charcoal/60">Gear</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-peak-charcoal">{vouchCount}</div>
            <div className="text-xs text-peak-charcoal/60">Vouches</div>
          </div>
          {memberDate && (
            <div className="text-center">
              <div className="font-bold text-peak-charcoal">{memberDate}</div>
              <div className="text-xs text-peak-charcoal/60">Joined</div>
            </div>
          )}
          {owner.peaksBalance !== undefined && owner.peaksBalance > 0 && (
            <div className="text-center">
              <div className="font-bold text-peak-gold">{owner.peaksBalance}</div>
              <div className="text-xs text-peak-charcoal/60">Peaks</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/profile/${owner.id}`}
            className="flex-1 px-4 py-2 bg-peak-forest text-white text-center text-sm font-medium rounded-lg hover:bg-peak-forest/90 transition-colors"
          >
            View Profile
          </Link>
          <MessageOwnerButton
            ownerId={owner.id}
            ownerName={owner.name || "Owner"}
            className="flex-1 px-4 py-2 bg-peak-cream text-peak-charcoal text-center text-sm font-medium rounded-lg hover:bg-peak-cream/80 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

export default OwnerCard;
