"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageOwnerButton } from "../chat/MessageOwnerButton";

interface ContactCardProps {
  contact: {
    id: string;
    contactId: string;
    metAt?: Date | string | null;
    notes?: string | null;
    contact: {
      id: string;
      name: string | null;
      email: string;
      avatarUrl?: string | null;
      locationName?: string | null;
      bio?: string | null;
      flavor?: string | null;
      foundingMember?: boolean;
      memberSince?: Date | string;
    };
  };
  showActions?: boolean;
  onRemove?: (id: string) => void;
  className?: string;
}

export function ContactCard({
  contact,
  showActions = true,
  onRemove,
  className = "",
}: ContactCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const person = contact.contact;

  const metDate = contact.metAt
    ? new Date(contact.metAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className={`perspective-1000 ${className}`}>
      <div
        className={`
          relative w-64 h-80 transition-transform duration-500 transform-style-3d cursor-pointer
          ${isFlipped ? "rotate-y-180" : ""}
        `}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front of card */}
        <div className="absolute inset-0 backface-hidden">
          <div className="h-full bg-white rounded-peak shadow-peak overflow-hidden peak-polaroid">
            {/* Decorative header */}
            <div className="h-20 bg-gradient-to-br from-peak-forest to-peak-forest/80 relative">
              <div className="absolute inset-0 opacity-10">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <pattern id="mountains" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M0 20 L10 5 L20 20 Z" fill="white" />
                  </pattern>
                  <rect width="100" height="100" fill="url(#mountains)" />
                </svg>
              </div>
              
              {/* Founding member badge */}
              {person.foundingMember && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-peak-gold text-peak-charcoal text-xs font-medium rounded-full">
                  ⛰️ Founder
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="relative -mt-10 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg">
                <div className="w-full h-full rounded-full bg-peak-cream flex items-center justify-center overflow-hidden">
                  {person.avatarUrl ? (
                    <Image
                      src={person.avatarUrl}
                      alt={person.name || "Contact"}
                      width={76}
                      height={76}
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-3xl">👤</span>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 text-center">
              <h3 className="font-serif text-lg font-bold text-peak-charcoal">
                {person.name || "Anonymous"}
              </h3>
              
              {person.flavor && (
                <p className="text-sm text-peak-forest italic mt-1">
                  &ldquo;{person.flavor}&rdquo;
                </p>
              )}
              
              {person.locationName && (
                <p className="text-xs text-peak-charcoal/60 mt-2">
                  📍 {person.locationName}
                </p>
              )}

              {metDate && (
                <p className="text-xs text-peak-charcoal/50 mt-2">
                  Met {metDate}
                </p>
              )}
            </div>

            {/* Flip hint */}
            <div className="absolute bottom-2 right-2 text-xs text-peak-charcoal/40">
              Tap to flip
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="h-full bg-white rounded-peak shadow-peak overflow-hidden p-4 flex flex-col">
            <h4 className="font-serif text-lg font-bold text-peak-charcoal mb-2">
              {person.name || "Anonymous"}
            </h4>

            {/* Bio */}
            {person.bio && (
              <p className="text-sm text-peak-charcoal/80 mb-3 flex-grow line-clamp-4">
                {person.bio}
              </p>
            )}

            {/* Notes */}
            {contact.notes && (
              <div className="bg-peak-cream/50 rounded-lg p-2 mb-3">
                <p className="text-xs text-peak-charcoal/60 font-medium mb-1">Your notes:</p>
                <p className="text-sm text-peak-charcoal/80 line-clamp-2">
                  {contact.notes}
                </p>
              </div>
            )}

            {/* Contact info */}
            <div className="text-xs text-peak-charcoal/60 mb-4">
              <div className="flex items-center gap-1">
                <span>📧</span>
                <span className="truncate">{person.email}</span>
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                <Link
                  href={`/profile/${person.id}`}
                  className="flex-1 px-3 py-2 bg-peak-forest text-white text-center text-xs font-medium rounded-lg hover:bg-peak-forest/90 transition-colors"
                >
                  Profile
                </Link>
                <MessageOwnerButton
                  ownerId={person.id}
                  ownerName={person.name || "Contact"}
                  className="flex-1 px-3 py-2 bg-peak-cream text-peak-charcoal text-center text-xs font-medium rounded-lg hover:bg-peak-cream/80 transition-colors"
                />
              </div>
            )}

            {/* Flip hint */}
            <div className="absolute bottom-2 right-2 text-xs text-peak-charcoal/40">
              Tap to flip
            </div>
          </div>
        </div>
      </div>

      {/* 3D transform styles */}
      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}

export default ContactCard;
