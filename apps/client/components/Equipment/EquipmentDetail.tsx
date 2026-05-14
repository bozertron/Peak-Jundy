"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, safeJsonParse } from "@/lib/utils";
import CheckoutFlow from "@/components/Stripe/CheckoutFlow";
import { MessageOwnerButton } from "@/components/chat/MessageOwnerButton";
import { determineTier, getTierDisplay } from "@/lib/peaks";

interface EquipmentDetailProps {
  viewerId?: string | null;
  equipment: {
    id: string;
    ownerId: string;
    title: string;
    description: string;
    category: string;
    specs: string;
    dailyRate: number;
    available: boolean;
    image?: string | null;
    location?: string | null;
    hourMeter?: number | null;
    owner: {
      name: string | null;
      email?: string | null;
      stripeAccountId?: string | null;
      avatarUrl?: string | null;
      flavor?: string | null;
      foundingMember?: boolean;
      memberSince?: Date | string | null;
      locationName?: string | null;
      peaksBalance?: number;
    };
  };
}

const CATEGORY_EMOJI: Record<string, string> = {
  Telehandler: "🏗️",
  "Boom Lift": "⬆️",
  "Scissor Lift": "📏",
  "Skid Steer": "🚜",
  Excavator: "⛏️",
  Compactor: "🪨",
  "ICF Bracing": "🧱",
  Formwork: "📐",
  "Concrete Tools": "🧰",
  Other: "🛠️",
};

function formatMemberSince(value?: Date | string | null) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

export default function EquipmentDetail({
  equipment,
  viewerId,
}: EquipmentDetailProps) {
  const router = useRouter();
  const specs = safeJsonParse<Record<string, unknown>>(equipment.specs, {});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const images = [
    equipment.image,
    ...(Array.isArray(specs.images) ? specs.images : []),
  ].filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0
  );
  const uniqueImages = Array.from(new Set(images));
  const isOwner = Boolean(viewerId && viewerId === equipment.ownerId);
  const activeImage = uniqueImages[activeImageIndex];
  const emoji = CATEGORY_EMOJI[equipment.category] ?? "🛠️";
  const tier =
    equipment.owner.peaksBalance !== undefined
      ? getTierDisplay(determineTier(equipment.owner.peaksBalance))
      : null;
  const memberSince = formatMemberSince(equipment.owner.memberSince);

  // Specs without the meta "images" field (which is used for the carousel).
  const renderableSpecs = Object.entries(specs).filter(
    ([key]) => key !== "images"
  );

  const handleDelete = async () => {
    if (
      !confirm(
        "Delete this listing? It'll disappear from the catalog and the map. This action can't be undone."
      )
    )
      return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/equipment/${equipment.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete listing.");
      }
      router.push("/dashboard/listings");
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-peak-cream py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="text-sm text-peak-charcoal/60 mb-4">
          <Link href="/browse" className="hover:text-peak-charcoal">
            Browse
          </Link>{" "}
          <span className="text-peak-charcoal/30">/</span>{" "}
          <span className="text-peak-charcoal/80">{equipment.category}</span>
        </nav>

        <div className="peak-frame bg-white rounded-peak overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image column */}
            <div className="p-6 lg:p-8 lg:border-r border-peak-charcoal/10">
              <div className="relative w-full aspect-[4/3] bg-peak-cream rounded-peak overflow-hidden">
                {activeImage ? (
                  <Image
                    src={activeImage}
                    alt={equipment.title}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-7xl">
                    {emoji}
                  </div>
                )}
                {!equipment.available && (
                  <div className="absolute top-3 right-3 bg-peak-burgundy text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-peak-sm">
                    Out on the slope
                  </div>
                )}
              </div>

              {uniqueImages.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {uniqueImages.map((src, index) => (
                    <button
                      key={`${src}-${index}`}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      aria-label={`Show image ${index + 1}`}
                      className={`relative w-16 h-16 rounded-peak overflow-hidden border-2 transition-all flex-shrink-0 ${
                        index === activeImageIndex
                          ? "border-peak-forest shadow-peak"
                          : "border-peak-stone hover:border-peak-charcoal/40"
                      }`}
                    >
                      <Image src={src} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Detail column */}
            <div className="p-6 lg:p-8 flex flex-col">
              <span className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
                {equipment.category}
              </span>
              <h1 className="font-serif text-3xl font-bold text-peak-charcoal mb-3 leading-tight">
                {equipment.title}
              </h1>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-serif text-4xl font-bold text-peak-forest">
                  {formatCurrency(equipment.dailyRate)}
                </span>
                <span className="text-sm text-peak-charcoal/60">/day</span>
              </div>

              <p className="text-peak-charcoal/80 leading-relaxed mb-6">
                {equipment.description}
              </p>

              {(equipment.location || equipment.hourMeter !== null) && (
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-peak-charcoal/70 mb-6 pb-6 border-b border-peak-charcoal/10">
                  {equipment.location && (
                    <span className="flex items-center gap-1">
                      <span aria-hidden>📍</span>
                      {equipment.location}
                    </span>
                  )}
                  {equipment.hourMeter !== null &&
                    equipment.hourMeter !== undefined && (
                      <span className="flex items-center gap-1">
                        <span aria-hidden>⏱️</span>
                        {equipment.hourMeter.toLocaleString()} hours
                      </span>
                    )}
                </div>
              )}

              {/* Owner block */}
              <div className="rounded-peak border border-peak-charcoal/10 bg-peak-cream/50 p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="relative w-12 h-12 rounded-full bg-peak-stone overflow-hidden flex-shrink-0">
                    {equipment.owner.avatarUrl ? (
                      <Image
                        src={equipment.owner.avatarUrl}
                        alt={equipment.owner.name ?? "Owner"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xl">
                        👤
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/profile/${equipment.ownerId}`}
                        className="font-serif text-base font-bold text-peak-charcoal hover:underline truncate"
                      >
                        {equipment.owner.name ?? "Owner"}
                      </Link>
                      {equipment.owner.foundingMember && (
                        <span
                          title="Founding member of Peak"
                          className="text-xs font-medium bg-peak-brass/15 text-peak-brass px-2 py-0.5 rounded-full whitespace-nowrap"
                        >
                          ⭐ Founder
                        </span>
                      )}
                      {tier && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{
                            backgroundColor: `${tier.color}15`,
                            color: tier.color,
                          }}
                          title={tier.description}
                        >
                          ⛰️ {tier.name}
                        </span>
                      )}
                    </div>
                    {equipment.owner.flavor && (
                      <p className="mt-1 text-sm text-peak-charcoal/70 italic">
                        &ldquo;{equipment.owner.flavor}&rdquo;
                      </p>
                    )}
                    {(equipment.owner.locationName || memberSince) && (
                      <p className="mt-2 text-xs text-peak-charcoal/60 flex flex-wrap gap-x-4">
                        {equipment.owner.locationName && (
                          <span>📍 {equipment.owner.locationName}</span>
                        )}
                        {memberSince && <span>Joined {memberSince}</span>}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 mt-auto">
                {!isOwner && viewerId && (
                  <MessageOwnerButton
                    ownerId={equipment.ownerId}
                    ownerName={equipment.owner.name || "Owner"}
                    equipmentId={equipment.id}
                    equipmentTitle={equipment.title}
                  />
                )}

                {!viewerId && (
                  <Link
                    href={`/auth/signin?callbackUrl=/equipment/${equipment.id}`}
                    className="block w-full py-3 px-4 rounded-peak bg-peak-forest text-white text-center font-medium hover:bg-peak-forest/90 transition-colors"
                  >
                    Sign in to rent or message
                  </Link>
                )}

                {equipment.available ? (
                  <CheckoutFlow
                    equipmentId={equipment.id}
                    dailyRate={equipment.dailyRate}
                    ownerStripeAccountId={equipment.owner.stripeAccountId || ""}
                  />
                ) : (
                  <div className="rounded-peak border border-peak-burgundy/30 bg-peak-burgundy/5 p-3 text-sm text-peak-burgundy text-center">
                    Currently out on the slope. Check back, or message the
                    owner to get on the list.
                  </div>
                )}

                {isOwner && (
                  <div className="pt-3 border-t border-peak-charcoal/10 space-y-2">
                    <p className="text-xs font-mono uppercase tracking-[0.15em] text-peak-slate">
                      Owner actions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/owner/listings/${equipment.id}/edit`}
                        className="px-4 py-2 rounded-peak border border-peak-charcoal/15 text-sm font-medium text-peak-charcoal hover:bg-peak-cream transition-colors"
                      >
                        Edit listing
                      </Link>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-4 py-2 rounded-peak border border-peak-burgundy/30 text-sm font-medium text-peak-burgundy hover:bg-peak-burgundy/5 disabled:opacity-50 transition-colors"
                      >
                        {deleting ? "Deleting…" : "Delete listing"}
                      </button>
                    </div>
                    {deleteError && (
                      <p className="text-sm text-peak-burgundy" role="alert">
                        {deleteError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Specs */}
          {renderableSpecs.length > 0 && (
            <div className="border-t border-peak-charcoal/10 p-6 lg:p-8 bg-peak-cream/30">
              <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-3">
                Specifications
              </p>
              <h2 className="font-serif text-xl font-bold text-peak-charcoal mb-5">
                The details
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {renderableSpecs.map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-peak border border-peak-charcoal/10 bg-white p-4"
                  >
                    <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-peak-slate mb-1">
                      {key.replace(/_/g, " ")}
                    </dt>
                    <dd className="text-peak-charcoal">
                      {Array.isArray(value) ? value.join(", ") : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
