"use client";

import Image from "next/image";
import type { ContactCardSubject, EquipmentPreview } from "@/types/api";

/**
 * ContactCard - Trading Card Style Contact Display
 *
 * Displays a collected contact as a "trading card" with:
 * - Avatar with wood-tinted frame
 * - Name in serif font
 * - Flavor badge (e.g., "Heavy Equipment", "Outdoor Adventure")
 * - Member since date
 * - Founding member badge if applicable
 * - Equipment count indicator
 * - Equipment preview (up to 3 items)
 * - Trust chain indicator (who introduced them)
 * - peak-frame styling with hover lift effect
 */

interface ContactCardProps {
  /** The contact subject data to display */
  contact: ContactCardSubject;
  /** Optional: Name of the person who introduced this contact */
  introducedBy?: string;
  /** Optional: Click handler for viewing full profile */
  onClick?: () => void;
}

export function ContactCard({
  contact,
  introducedBy,
  onClick,
}: ContactCardProps) {
  const memberYear = contact.memberSince
    ? new Date(contact.memberSince).getFullYear()
    : null;

  // Get up to 3 equipment items for preview
  const equipmentPreviewItems = contact.equipmentPreview?.slice(0, 3) || [];

  return (
    <div
      className={`
        peak-frame
        w-72
        cursor-pointer
        group
        transition-all duration-300 ease-out
        hover:shadow-peak-lift hover:-translate-y-1
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`View profile of ${contact.name || "Contact"}`}
    >
      {/* Card Header with Avatar */}
      <div className="relative">
        {/* Decorative Background Pattern */}
        <div className="h-24 bg-gradient-to-br from-peak-forest via-peak-forest/90 to-peak-navy relative overflow-hidden">
          {/* Subtle mountain pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
              <path d="M0 50 L20 20 L40 35 L60 10 L80 30 L100 15 L100 50 Z" fill="currentColor" className="text-white" />
            </svg>
          </div>

          {/* Founding Member Badge */}
          {contact.foundingMember && (
            <div
              className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-peak-brass shadow-sm"
              title="Founding Member"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-semibold text-white">Founder</span>
            </div>
          )}
        </div>

        {/* Avatar with Wood-Tinted Frame */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-10">
          <div className="w-20 h-20 rounded-lg overflow-hidden border-[3px] border-peak-wood-light/40 shadow-peak-frame bg-peak-snow">
            {contact.avatarUrl ? (
              <Image
                src={contact.avatarUrl}
                alt={contact.name || "Contact avatar"}
                width={80}
                height={80}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-peak-forest/10 to-peak-forest/20 flex items-center justify-center">
                <span className="text-3xl font-serif text-peak-forest font-bold">
                  {(contact.name?.charAt(0) || "?").toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="pt-14 pb-5 px-5">
        {/* Wood Accent Bar */}
        <div className="peak-wood-accent w-12 mx-auto mb-4" />

        {/* Name - Serif Font */}
        <h3 className="font-serif text-xl text-peak-charcoal text-center leading-tight mb-2">
          {contact.name || "Anonymous"}
        </h3>

        {/* Flavor Badge */}
        {contact.flavor && (
          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-peak-forest/10 text-peak-forest border border-peak-forest/20">
              {contact.flavor}
            </span>
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-center gap-4 text-xs text-peak-slate mb-4">
          {memberYear && (
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Since {memberYear}</span>
            </div>
          )}

          {/* Equipment Count Indicator */}
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>{contact.equipmentCount} {contact.equipmentCount === 1 ? "item" : "items"}</span>
          </div>
        </div>

        {/* Equipment Preview (up to 3 items) */}
        {equipmentPreviewItems.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-peak-slate/70 uppercase tracking-wider font-medium mb-2 text-center">
              Equipment
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {equipmentPreviewItems.map((item: EquipmentPreview) => (
                <span
                  key={item.id}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-peak-cream text-peak-charcoal border border-peak-stone/50"
                  title={`${item.title} - $${item.dailyRate}/day`}
                >
                  {item.category}
                </span>
              ))}
              {contact.equipmentCount > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-peak-stone/30 text-peak-slate">
                  +{contact.equipmentCount - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Trust Chain Indicator */}
        {introducedBy && (
          <div className="pt-3 border-t border-peak-stone/50">
            <div className="flex items-center justify-center gap-2 text-xs text-peak-slate/80">
              <svg className="w-3.5 h-3.5 text-peak-brass" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>
                via <span className="font-medium text-peak-charcoal">{introducedBy}</span>
              </span>
            </div>
          </div>
        )}

        {/* View Profile Hint */}
        <div className="mt-4 text-center">
          <span className="text-xs text-peak-forest/60 group-hover:text-peak-forest transition-colors duration-200">
            Click to view profile
          </span>
        </div>
      </div>
    </div>
  );
}

export default ContactCard;
