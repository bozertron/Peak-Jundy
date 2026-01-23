import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  try {
    const [equipmentCount, bookingCount, revenue] = await Promise.all([
      prisma.equipment.count({ where: { ownerId: userId } }),
      prisma.booking.count({ where: { equipment: { ownerId: userId } } }),
      prisma.booking.aggregate({
        where: { equipment: { ownerId: userId }, status: "CONFIRMED" },
        _sum: { totalPrice: true },
      }),
    ]);

    return NextResponse.json({
      equipmentCount,
      bookingCount,
      revenueCents: revenue._sum.totalPrice ?? 0,
    });
  } catch (error) {
    console.error("Owner stats error:", error);
    return NextResponse.json({ error: "Failed to fetch owner stats" }, { status: 500 });
  }
}
