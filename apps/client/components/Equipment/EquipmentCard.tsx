"use client";

import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Equipment } from "@/lib/types";

interface EquipmentCardProps {
  equipment: Equipment;
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

export default function EquipmentCard({ equipment }: EquipmentCardProps) {
  const {
    id,
    title,
    category,
    dailyRate,
    owner,
    image,
    available = true,
    location,
  } = equipment;
  const emoji = CATEGORY_EMOJI[category] ?? "🛠️";

  return (
    <Link
      href={`/equipment/${id}`}
      className="group h-full"
      aria-label={`View ${title}`}
    >
      <div className="peak-frame bg-white rounded-peak overflow-hidden h-full flex flex-col transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-peak-lift">
        {/* Image */}
        <div className="relative w-full aspect-[5/3] bg-peak-cream">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl">
              {emoji}
            </div>
          )}
          {!available && (
            <div className="absolute top-3 right-3 bg-peak-burgundy text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-peak-sm">
              Out on the slope
            </div>
          )}
          {/* Wood accent — subtle brass stripe */}
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #B8860B 50%, transparent 100%)",
            }}
          />
        </div>

        {/* Body */}
        <div className="p-4 flex-1 flex flex-col">
          <span className="font-mono uppercase tracking-[0.15em] text-[10px] text-peak-slate mb-1">
            {category}
          </span>
          <h3 className="font-serif text-lg font-bold text-peak-charcoal mb-1 line-clamp-2 leading-tight">
            {title}
          </h3>
          {location && (
            <p className="text-xs text-peak-charcoal/60 mb-3 flex items-center gap-1">
              <span aria-hidden>📍</span>
              {location}
            </p>
          )}

          <div className="mt-auto pt-3 flex items-baseline justify-between border-t border-peak-charcoal/10">
            <div>
              <p className="text-xl font-bold text-peak-forest">
                {formatCurrency(dailyRate)}
              </p>
              <p className="text-[11px] text-peak-charcoal/50 leading-tight">
                per day
              </p>
            </div>
            <p className="text-xs text-peak-charcoal/60 text-right">
              by{" "}
              <span className="text-peak-charcoal/80 font-medium">
                {owner.name ?? "a neighbor"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
