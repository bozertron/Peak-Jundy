"use client";

import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Equipment } from "@/lib/types";

interface EquipmentCardProps {
  equipment: Equipment;
}

export default function EquipmentCard({ equipment }: EquipmentCardProps) {
  const { id, title, category, dailyRate, owner, image, available = true, location } = equipment;
  return (
    <Link href={`/equipment/${id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer h-full flex flex-col">
        <div className="relative w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300">
          {image ? (
            <Image src={image} alt={title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8" />
              </svg>
            </div>
          )}
          {!available && (
            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
              Unavailable
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-2">{category}</p>
          {location && <p className="text-xs text-gray-400 mb-2">📍 {location}</p>}

          <div className="mt-auto flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(dailyRate)}</p>
              <p className="text-xs text-gray-500">per day</p>
            </div>
            <p className="text-xs text-gray-500">by {owner.name ?? "Owner"}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
