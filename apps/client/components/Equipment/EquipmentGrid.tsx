import { Equipment } from "@/lib/types";
import EquipmentCard from "@/components/Equipment/EquipmentCard";

interface EquipmentGridProps {
  equipment: Equipment[];
}

export default function EquipmentGrid({ equipment }: EquipmentGridProps) {
  if (!equipment?.length) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center text-gray-600">
        No equipment found.
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
