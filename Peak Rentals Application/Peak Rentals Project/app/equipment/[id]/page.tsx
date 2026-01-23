import { prisma } from "@/lib/prisma";
import EquipmentDetail from "@/components/Equipment/EquipmentDetail";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function EquipmentPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const equipment = await prisma.equipment.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, email: true, stripeAccountId: true } },
    },
  });

  if (!equipment) notFound();

  const viewerId = session?.user?.id ?? null;
  const ownerEmail = session ? equipment.owner.email : null;

  return (
    <EquipmentDetail
      viewerId={viewerId}
      equipment={{
        ...equipment,
        owner: {
          name: equipment.owner.name,
          stripeAccountId: equipment.owner.stripeAccountId,
          email: ownerEmail,
        },
      }}
    />
  );
}
