/**
 * Equipment Storefront
 *
 * Displays all available equipment from all owners that customers can rent.
 * Allows customers to browse equipment and proceed to checkout.
 *
 * Features:
 * - Lists all equipment with pricing
 * - Shows owner information
 * - "Rent Now" button to proceed to Stripe Checkout
 * - Handles checkout flow with destination charges
 */

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Equipment } from "@/lib/types";

interface EquipmentWithOwner extends Equipment {
  owner: {
    name: string | null;
    stripeAccountId: string | null;
  };
}

interface StorefrontProps {
  equipment: EquipmentWithOwner[];
}

export default function Storefront({ equipment }: StorefrontProps) {
  const { data: session, status } = useSession();
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles rental purchases
   *
   * Creates a Stripe Checkout Session with:
   * - Product pricing information
   * - Platform fee calculation
   * - Destination charge to owner's account
   *
   * Redirects customer to Stripe's hosted payment page
   */
  const handleRentNow = async (item: EquipmentWithOwner) => {
    // Verify user is signed in
    if (status === "unauthenticated") {
      alert("Please sign in to rent equipment");
      return;
    }

    // Verify owner has Stripe account
    if (!item.owner.stripeAccountId) {
      setError(`${item.owner.name || "Owner"} is not ready to accept payments yet. Please try again later.`);
      return;
    }

    setIsCheckingOut(true);
    setError(null);

    try {
      // Create a checkout session for this rental
      // This initiates the payment flow with destination charge
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: "price_placeholder", // TODO: Use actual Stripe price ID from product
          quantity,
          connectedAccountId: item.owner.stripeAccountId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create checkout session");
      }

      const data = await response.json();

      // Redirect customer to Stripe's payment page
      // The session.url contains the hosted checkout experience
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Checkout error:", err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  /**
   * Renders a single equipment card
   * Shows image, description, pricing, and rent button
   */
  const EquipmentCard = ({ item }: { item: EquipmentWithOwner }) => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {/* Equipment image or placeholder */}
      <div className="relative w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="text-6xl text-gray-400">🏗️</div>
        )}
      </div>

      {/* Equipment details */}
      <div className="p-4">
        {/* Title and category */}
        <h3 className="font-semibold text-lg text-gray-900 mb-1">
          {item.title}
        </h3>
        <p className="text-sm text-gray-600 mb-2">{item.category}</p>

        {/* Location */}
        {item.location && (
          <p className="text-xs text-gray-500 mb-3">📍 {item.location}</p>
        )}

        {/* Description */}
        <p className="text-sm text-gray-700 mb-4 line-clamp-2">
          {item.description}
        </p>

        {/* Pricing and owner */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-bold text-blue-600">
              ${(item.dailyRate / 100).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">per day</p>
          </div>
          <p className="text-xs text-gray-600 text-right">
            {item.owner.name ? `by ${item.owner.name}` : "by Owner"}
          </p>
        </div>

        {/* Availability status */}
        {!item.available && (
          <div className="bg-red-50 border border-red-200 rounded p-2 mb-4 text-center">
            <p className="text-red-700 text-sm font-medium">Unavailable</p>
          </div>
        )}

        {/* Rent button */}
        <button
          onClick={() => {
            setSelectedEquipment(item.id);
            handleRentNow(item);
          }}
          disabled={!item.available || isCheckingOut === true}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {isCheckingOut && selectedEquipment === item.id
            ? "Processing..."
            : "Rent Now"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Browse Equipment
        </h1>
        <p className="text-gray-600">
          Find and rent equipment from trusted local owners
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-7xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-600 hover:text-red-800 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Authentication prompt */}
      {status === "unauthenticated" && (
        <div className="max-w-7xl mx-auto mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
          <p>
            Please{" "}
            <a href="/auth/signin" className="underline hover:no-underline">
              sign in
            </a>{" "}
            to rent equipment.
          </p>
        </div>
      )}

      {/* Equipment grid */}
      <div className="max-w-7xl mx-auto">
        {equipment && equipment.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map((item) => (
              <EquipmentCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 text-lg mb-2">No equipment available</p>
            <p className="text-gray-500">Check back soon for new listings</p>
          </div>
        )}
      </div>

      {/* Stripe info footer */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
        <p>🔒 Secure payments powered by Stripe</p>
      </div>
    </div>
  );
}
