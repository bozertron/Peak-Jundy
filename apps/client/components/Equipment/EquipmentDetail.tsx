"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, safeJsonParse } from "@/lib/utils";
import CheckoutFlow from "@/components/Stripe/CheckoutFlow";
import { MessageOwnerButton } from "@/components/chat/MessageOwnerButton";

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
    owner: { name: string | null; email?: string | null; stripeAccountId?: string | null };
  };
}

export default function EquipmentDetail({ equipment, viewerId }: EquipmentDetailProps) {
  const router = useRouter();
  const specs = safeJsonParse<Record<string, unknown>>(equipment.specs, {});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const images = [
    equipment.image,
    ...(Array.isArray(specs.images) ? specs.images : []),
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  const uniqueImages = Array.from(new Set(images));
  const isOwner = Boolean(viewerId && viewerId === equipment.ownerId);
  const activeImage = uniqueImages[activeImageIndex];

  const handleDelete = async () => {
    if (!confirm("Delete this listing? This action cannot be undone.")) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/equipment/${equipment.id}`, { method: "DELETE" });
      const data = await res.json();
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
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="relative w-full h-72 bg-gray-100 rounded-lg overflow-hidden">
              {activeImage ? (
                <Image
                  src={activeImage}
                  alt={equipment.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
            </div>

            {uniqueImages.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {uniqueImages.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative w-16 h-16 rounded border ${
                      index === activeImageIndex ? "border-blue-600" : "border-gray-200"
                    }`}
                  >
                    <Image src={src} alt="" fill className="object-cover rounded" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{equipment.title}</h1>
                <p className="text-gray-600">Category: {equipment.category}</p>
                {equipment.location && <p className="text-gray-600">Location: {equipment.location}</p>}
                {equipment.hourMeter !== null && equipment.hourMeter !== undefined && (
                  <p className="text-gray-600">Hour meter: {equipment.hourMeter}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(equipment.dailyRate)}
                </p>
                <p className="text-gray-500">per day</p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">Owner</p>
              <p className="text-gray-900 font-medium">{equipment.owner.name ?? "Owner"}</p>
              {equipment.owner.email ? (
                <a className="text-sm text-blue-600" href={`mailto:${equipment.owner.email}`}>
                  {equipment.owner.email}
                </a>
              ) : (
                <p className="text-sm text-gray-500">
                  <Link href={`/auth/signin?callbackUrl=/equipment/${equipment.id}`}>
                    Sign in to view contact
                  </Link>
                </p>
              )}
            </div>

            {/* Peak Enhancement: Message Owner Button (additive) */}
            {!isOwner && viewerId && (
              <div className="border rounded-lg p-4">
                <MessageOwnerButton
                  ownerId={equipment.ownerId}
                  ownerName={equipment.owner.name || "Owner"}
                  equipmentId={equipment.id}
                  equipmentTitle={equipment.title}
                />
              </div>
            )}

            {isOwner && (
              <div className="border rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-gray-900">Owner Actions</p>
                <div className="flex flex-wrap gap-3">
                  <Link className="btn-secondary" href={`/owner/listings/${equipment.id}/edit`}>
                    Edit Listing
                  </Link>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete Listing"}
                  </button>
                </div>
                {deleteError && (
                  <p className="text-sm text-red-600">{deleteError}</p>
                )}
              </div>
            )}

            <div className="border-t pt-6">
              {equipment.available ? (
                <CheckoutFlow
                  equipmentId={equipment.id}
                  dailyRate={equipment.dailyRate}
                  ownerStripeAccountId={equipment.owner.stripeAccountId || ""}
                />
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 font-semibold">Currently unavailable</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="prose max-w-none">
          <h2 className="text-xl font-semibold mb-3">Description</h2>
          <p className="text-gray-700">{equipment.description}</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Technical Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(specs).map(([key, value]) => (
              <div key={key} className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 capitalize">
                  {key.replace(/_/g, " ")}
                </p>
                <p className="text-gray-600">
                  {Array.isArray(value) ? value.join(", ") : String(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
