import EquipmentForm from "@/components/Equipment/EquipmentForm";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

export default async function EditListingPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

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
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Edit Listing</h1>
      <EquipmentForm mode="edit" initial={equipment} />
    </div>
  );
}
