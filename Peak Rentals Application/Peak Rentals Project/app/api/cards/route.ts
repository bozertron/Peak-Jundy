// GET /api/cards - Get user's collected contact cards

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cards = await prisma.contactCard.findMany({
    where: { collectorId: session.user.id },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          flavor: true,
          memberSince: true,
          foundingMember: true,
          _count: {
            select: { equipment: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Enrich with equipment preview for each card
  const enrichedCards = await Promise.all(
    cards.map(async (card) => {
      const equipmentPreview = await prisma.equipment.findMany({
        where: { ownerId: card.subjectId, available: true },
        select: { id: true, title: true, category: true, dailyRate: true },
        take: 3
      });

      return {
        ...card,
        subject: {
          ...card.subject,
          equipmentCount: card.subject._count.equipment,
          equipmentPreview
        }
      };
    })
  );

  return NextResponse.json({ cards: enrichedCards });
}
