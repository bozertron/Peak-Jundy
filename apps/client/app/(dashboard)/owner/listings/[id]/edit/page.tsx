import EquipmentForm from "@/components/Equipment/EquipmentForm";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditListingPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const equipment = await prisma.equipment.findUnique({
    where: { id: params.id },
  });

  if (!equipment) notFound();

  const canEdit =
    equipment.ownerId === session.user.id || session.user.role === "ADMIN";

  if (!canEdit) {
    redirect("/dashboard?error=forbidden");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="peak-frame bg-white rounded-peak p-6">
        <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
          Edit listing
        </p>
        <h1 className="font-serif text-2xl font-bold text-peak-charcoal">
          {equipment.title}
        </h1>
      </div>
      <EquipmentForm mode="edit" initial={equipment} />
    </div>
  );
}
