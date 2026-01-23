// GET /api/trust/visible-equipment - Equipment from user's trust network only

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const query = searchParams.get("q");

  // Get visible user IDs from trust network
  const [vouchers, vouchees] = await Promise.all([
    prisma.vouch.findMany({
      where: { voucheeId: session.user.id, broadcast: true },
      select: { voucherId: true }
    }),
    prisma.vouch.findMany({
      where: { voucherId: session.user.id, broadcast: true },
      select: { voucheeId: true }
    })
  ]);

  // Get direct connection IDs
  const directConnectionIds = [
    ...vouchers.map(v => v.voucherId),
    ...vouchees.map(v => v.voucheeId)
  ];

  // Get extended network (degree 2)
  const extendedVouches = await prisma.vouch.findMany({
    where: {
      voucherId: { in: directConnectionIds },
      broadcast: true
    },
    select: { voucheeId: true }
  });

  const visibleOwnerIds = new Set([
    session.user.id, // Own equipment
    ...directConnectionIds,
    ...extendedVouches.map(v => v.voucheeId)
  ]);

  // Build equipment query
  const where: any = {
    ownerId: { in: Array.from(visibleOwnerIds) },
    available: true
  };

  if (category) {
    where.category = { equals: category, mode: "insensitive" };
  }

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } }
    ];
  }

  const equipment = await prisma.equipment.findMany({
    where,
    include: {
      owner: {
        select: { 
          id: true, 
          name: true, 
          avatarUrl: true, 
          flavor: true,
          latitude: true,
          longitude: true,
          locationName: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ equipment, count: equipment.length });
}
