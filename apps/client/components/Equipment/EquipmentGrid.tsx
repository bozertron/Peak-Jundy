import { Equipment } from "@/lib/types";
import EquipmentCard from "@/components/Equipment/EquipmentCard";

interface EquipmentGridProps {
  equipment: Equipment[];
  emptyTitle?: string;
  emptyBody?: string;
}

export default function EquipmentGrid({
  equipment,
  emptyTitle = "Quiet on the slopes today.",
  emptyBody = "Nothing matches that search yet. Try a different category, or check back when more neighbors hang up their snow gear.",
}: EquipmentGridProps) {
  if (!equipment?.length) {
    return (
      <div className="peak-frame bg-white rounded-peak p-10 text-center max-w-xl mx-auto">
        <div className="text-5xl mb-4" aria-hidden>
          🪧
        </div>
        <h3 className="font-serif text-xl font-bold text-peak-charcoal mb-2">
          {emptyTitle}
        </h3>
        <p className="text-peak-charcoal/70 text-sm leading-relaxed">
          {emptyBody}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {equipment.map((item) => (
        <EquipmentCard key={item.id} equipment={item} />
      ))}
    </div>
  );
}
