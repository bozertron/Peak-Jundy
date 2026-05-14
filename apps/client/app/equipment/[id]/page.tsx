import { prisma } from "@/lib/prisma";
import EquipmentDetail from "@/components/Equipment/EquipmentDetail";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EquipmentPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const equipment = await prisma.equipment.findUnique({
    where: { id: params.id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          stripeAccountId: true,
          avatarUrl: true,
          flavor: true,
          foundingMember: true,
          memberSince: true,
          locationName: true,
          peaksBalance: true,
        },
      },
    },
  });

  if (!equipment) notFound();

  const viewerId = session?.user?.id ?? null;
  // Email shown only to signed-in viewers (don't leak owner email to the public).
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
          avatarUrl: equipment.owner.avatarUrl,
          flavor: equipment.owner.flavor,
          foundingMember: equipment.owner.foundingMember,
          memberSince: equipment.owner.memberSince,
          locationName: equipment.owner.locationName,
          peaksBalance: equipment.owner.peaksBalance,
        },
      }}
    />
  );
}
