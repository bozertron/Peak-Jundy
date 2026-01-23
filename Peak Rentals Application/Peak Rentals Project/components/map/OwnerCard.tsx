"use client";

import Image from "next/image";
import Link from "next/link";

/**
 * OwnerCard - Map pin popup component
 *
 * Displays when an equipment pin is clicked on the map.
 * Shows owner information, equipment preview, and action buttons.
 * Follows PEAK AESTHETIC: peak-frame styling, serif headings, warm colors.
 */

interface EquipmentPreview {
  id: string;
  title: string;
  category: string;
  dailyRate: number;
  imageUrl?: string | null;
}

interface Owner {
  id: string;
  name: string | null;
  avatarUrl?: string | null;
  flavor?: string | null;
  locationName?: string | null;
  foundingMember?: boolean;
  memberSince?: Date | string;
}

interface OwnerCardProps {
  /** Equipment being displayed */
  equipment: EquipmentPreview;
  /** Owner of the equipment */
  owner: Owner;
  /** Trust network degree (1 = direct connection, 2+ = extended network) */
  trustDegree?: number;
  /** Name of person who introduced this connection (for extended network) */
  introducedBy?: string;
  /** Callback when Message button is clicked */
  onMessage?: () => void;
  /** Callback when View Profile is clicked */
  onViewProfile?: () => void;
  /** Callback to close the card */
  onClose: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Trust degree indicator component
 * Shows the degree of connection in the trust network
 */
function TrustIndicator({ degree }: { degree: number }) {
  const isDirect = degree === 1;

  return (
    <div
      className={`
        flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        ${isDirect
          ? "bg-peak-forest text-white"
          : "bg-peak-stone text-peak-slate"
        }
      `}
      title={isDirect ? "Direct connection" : `${degree} degrees away`}
    >
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
      <span>{degree}{degree === 1 ? "st" : degree === 2 ? "nd" : degree === 3 ? "rd" : "th"}</span>
    </div>
  );
}

/**
 * Founding member badge component
 * Brass/gold star badge for founding members
 */
function FoundingMemberBadge() {
  return (
    <div
      className="w-5 h-5 rounded-full bg-peak-brass flex items-center justify-center shadow-sm"
      title="Founding Member"
    >
      <svg
        className="w-3 h-3 text-white"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    </div>
  );
}

export function OwnerCard({
  equipment,
  owner,
  trustDegree,
  introducedBy,
  onMessage,
  onViewProfile,
  onClose,
  className = "",
}: OwnerCardProps) {
  // Format the daily rate (assuming it's in cents)
  const formattedRate = typeof equipment.dailyRate === 'number'
    ? (equipment.dailyRate >= 100
        ? `$${Math.floor(equipment.dailyRate / 100)}`
        : `$${equipment.dailyRate}`)
    : equipment.dailyRate;

  // Get member since year if available
  const memberYear = owner.memberSince
    ? new Date(owner.memberSince).getFullYear()
    : null;

  return (
    <div
      className={`
        bg-peak-snow rounded-peak shadow-peak-lg overflow-hidden
        peak-frame w-80 peak-animate-in
        ${className}
      `}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-peak-snow/90
                   flex items-center justify-center text-peak-slate
                   hover:bg-peak-snow hover:text-peak-charcoal
                   transition-colors shadow-sm"
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Equipment Preview Section */}
      <div className="relative">
        {/* Equipment Image */}
        <div className="h-40 bg-peak-cream relative overflow-hidden">
          {equipment.imageUrl ? (
            <Image
              src={equipment.imageUrl}
              alt={equipment.title}
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-peak-forest/5 to-peak-cream">
              <span className="text-5xl opacity-50">
                {getCategoryEmoji(equipment.category)}
              </span>
            </div>
          )}

          {/* Subtle vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-peak-charcoal/30 via-transparent to-transparent" />

          {/* Category badge */}
          <div className="absolute bottom-3 left-3">
            <span className="px-2.5 py-1 text-xs font-medium uppercase tracking-wider
                           bg-peak-snow/95 text-peak-forest rounded-full shadow-sm">
              {equipment.category}
            </span>
          </div>

          {/* Trust indicator */}
          {trustDegree && (
            <div className="absolute top-3 left-3">
              <TrustIndicator degree={trustDegree} />
            </div>
          )}
        </div>

        {/* Equipment Info */}
        <div className="p-4 border-b border-peak-stone/50">
          {/* Wood accent */}
          <div className="peak-wood-accent w-10 mb-3" />

          <h3 className="font-serif text-lg text-peak-charcoal leading-tight mb-2 line-clamp-2">
            {equipment.title}
          </h3>

          <div className="flex items-baseline gap-1">
            <span className="text-xl font-semibold text-peak-forest">
              {formattedRate}
            </span>
            <span className="text-sm text-peak-slate">/day</span>
          </div>
        </div>
      </div>

      {/* Owner Section */}
      <div className="p-4 bg-gradient-to-br from-peak-cream/30 to-transparent">
        <div className="flex items-start gap-3">
          {/* Avatar with frame */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-peak-wood-light/30
                            bg-peak-snow shadow-sm">
              {owner.avatarUrl ? (
                <Image
                  src={owner.avatarUrl}
                  alt={owner.name || "Owner"}
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-peak-forest/10">
                  <span className="text-xl font-serif text-peak-forest">
                    {(owner.name || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Founding member badge */}
            {owner.foundingMember && (
              <div className="absolute -top-1 -right-1">
                <FoundingMemberBadge />
              </div>
            )}
          </div>

          {/* Owner Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-serif text-peak-charcoal font-medium truncate">
              {owner.name || "Anonymous"}
            </h4>

            {owner.flavor && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs
                               bg-peak-forest/10 text-peak-forest truncate max-w-full">
                {owner.flavor}
              </span>
            )}

            <div className="mt-1.5 flex items-center gap-2 text-xs text-peak-slate">
              {owner.locationName && (
                <span className="flex items-center gap-1 truncate">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {owner.locationName}
                </span>
              )}
              {memberYear && (
                <span className="flex-shrink-0">Since {memberYear}</span>
              )}
            </div>

            {/* Trust chain info for extended network */}
            {trustDegree && trustDegree > 1 && introducedBy && (
              <p className="mt-1.5 text-xs text-peak-slate/80 italic">
                via {introducedBy}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 flex gap-2">
        {onViewProfile ? (
          <button
            onClick={onViewProfile}
            className="flex-1 py-2.5 text-center text-sm font-medium text-peak-charcoal
                       border border-peak-wood/30 rounded-peak
                       hover:bg-peak-cream/50 hover:border-peak-wood/50
                       transition-colors"
          >
            View Profile
          </button>
        ) : (
          <Link
            href={`/profile/${owner.id}`}
            className="flex-1 py-2.5 text-center text-sm font-medium text-peak-charcoal
                       border border-peak-wood/30 rounded-peak
                       hover:bg-peak-cream/50 hover:border-peak-wood/50
                       transition-colors"
          >
            View Profile
          </Link>
        )}

        <button
          onClick={onMessage}
          className="flex-1 py-2.5 text-center text-sm font-medium text-white
                     bg-peak-burgundy rounded-peak
                     hover:bg-peak-burgundy/90
                     transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Message
        </button>
      </div>

      {/* View Equipment Link */}
      <div className="px-4 pb-4">
        <Link
          href={`/equipment/${equipment.id}`}
          className="block w-full py-2 text-center text-sm text-peak-forest
                     hover:text-peak-forest/80 hover:underline
                     transition-colors"
        >
          View Equipment Details
        </Link>
      </div>
    </div>
  );
}

/**
 * Get emoji icon for equipment category
 */
function getCategoryEmoji(category: string): string {
  const categoryMap: Record<string, string> = {
    "Telehandler": "🏗️",
    "Heavy Equipment": "🏗️",
    "Boom Lift": "⬆️",
    "Aerial Lift": "⬆️",
    "Skid Steer": "🚜",
    "Vehicle": "🚗",
    "Tools": "🔧",
    "Power Tools": "🔧",
    "Recreation": "🎿",
    "Winter Sports": "🎿",
    "Ski Equipment": "⛷️",
    "Snowboard": "🏂",
    "Camping": "⛺",
    "Water Sports": "🚣",
    "Bikes": "🚲",
    "Photography": "📷",
    "Audio": "🎵",
    "Electronics": "💻",
  };
  return categoryMap[category] || "📦";
}

export default OwnerCard;
