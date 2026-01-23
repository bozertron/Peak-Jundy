// GET /api/trust/network - Get user's visible network (trust graph)

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // 1. Direct connections (people who vouched for me, broadcast)
  const directVouchers = await prisma.vouch.findMany({
    where: { voucheeId: userId, broadcast: true },
    include: { 
      voucher: { 
        select: { 
          id: true, 
          name: true, 
          avatarUrl: true, 
          flavor: true, 
          latitude: true, 
          longitude: true,
          memberSince: true,
          foundingMember: true
        } 
      } 
    }
  });

  // 2. People I've vouched for (broadcast)
  const myVouchees = await prisma.vouch.findMany({
    where: { voucherId: userId, broadcast: true },
    include: { 
      vouchee: { 
        select: { 
          id: true, 
          name: true, 
          avatarUrl: true, 
          flavor: true, 
          latitude: true, 
          longitude: true,
          memberSince: true,
          foundingMember: true
        } 
      } 
    }
  });

  // 3. Extended network: people broadcast by my direct connections
  const directConnectionIds = [
    ...directVouchers.map(v => v.voucherId),
    ...myVouchees.map(v => v.voucheeId)
  ];

  const extendedNetwork = await prisma.vouch.findMany({
    where: {
      voucherId: { in: directConnectionIds },
      broadcast: true,
      voucheeId: { not: userId }
    },
    include: {
      vouchee: { 
        select: { 
          id: true, 
          name: true, 
          avatarUrl: true, 
          flavor: true, 
          latitude: true, 
          longitude: true,
          memberSince: true,
          foundingMember: true
        } 
      },
      voucher: { select: { id: true, name: true } } // Who introduced them
    }
  });

  // Deduplicate and structure
  const networkMap = new Map<string, any>();
  
  // Direct connections (degree 1)
  directVouchers.forEach(v => {
    networkMap.set(v.voucher.id, { ...v.voucher, degree: 1, introducedBy: null });
  });
  myVouchees.forEach(v => {
    networkMap.set(v.vouchee.id, { ...v.vouchee, degree: 1, introducedBy: null });
  });
  
  // Extended connections (degree 2)
  extendedNetwork.forEach(v => {
    if (!networkMap.has(v.vouchee.id)) {
      networkMap.set(v.vouchee.id, { 
        ...v.vouchee, 
        degree: 2, 
        introducedBy: v.voucher.name 
      });
    }
  });

  const network = Array.from(networkMap.values());

  return NextResponse.json({ 
    network,
    stats: {
      direct: directVouchers.length + myVouchees.length,
      extended: network.length - (directVouchers.length + myVouchees.length),
      total: network.length
    }
  });
}
