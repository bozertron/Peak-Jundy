// POST /api/trust/vouch - Create initial vouch (private connection)
// PUT /api/trust/vouch - Broadcast to network

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, note } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Find or invite the vouchee
  let vouchee = await prisma.user.findUnique({ where: { email } });
  
  if (!vouchee) {
    // Create placeholder user (they'll complete profile on first login)
    vouchee = await prisma.user.create({
      data: { email, memberSince: new Date() }
    });
  }

  // Can't vouch for yourself
  if (vouchee.id === session.user.id) {
    return NextResponse.json({ error: "Cannot vouch for yourself" }, { status: 400 });
  }

  // Check if vouch already exists
  const existing = await prisma.vouch.findUnique({
    where: {
      voucherId_voucheeId: {
        voucherId: session.user.id,
        voucheeId: vouchee.id
      }
    }
  });

  if (existing) {
    return NextResponse.json({ error: "Already vouched" }, { status: 400 });
  }

  // Create vouch (not yet broadcast)
  const vouch = await prisma.vouch.create({
    data: {
      voucherId: session.user.id,
      voucheeId: vouchee.id,
      note,
      broadcast: false
    },
    include: { vouchee: { select: { id: true, name: true, email: true } } }
  });

  // Create mutual contact cards
  await prisma.contactCard.createMany({
    data: [
      { collectorId: session.user.id, subjectId: vouchee.id, origin: "vouch" },
      { collectorId: vouchee.id, subjectId: session.user.id, origin: "vouch" }
    ],
    skipDuplicates: true
  });

  // Award Peaks for vouching
  await prisma.peaksTransaction.create({
    data: {
      userId: session.user.id,
      amount: 5,
      reason: "vouch_given",
      referenceId: vouch.id,
      referenceType: "vouch"
    }
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { peaksBalance: { increment: 5 } }
  });

  return NextResponse.json({ vouch }, { status: 201 });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vouchId } = await request.json();

  if (!vouchId) {
    return NextResponse.json({ error: "Vouch ID is required" }, { status: 400 });
  }

  // Verify ownership
  const vouch = await prisma.vouch.findUnique({
    where: { id: vouchId },
    include: { vouchee: true }
  });

  if (!vouch || vouch.voucherId !== session.user.id) {
    return NextResponse.json({ error: "Not your vouch" }, { status: 403 });
  }

  if (vouch.broadcast) {
    return NextResponse.json({ error: "Already broadcast" }, { status: 400 });
  }

  // Broadcast: this person is now visible to voucher's network
  const updated = await prisma.vouch.update({
    where: { id: vouchId },
    data: { broadcast: true, broadcastAt: new Date() }
  });

  return NextResponse.json({ vouch: updated });
}

// GET /api/trust/vouch - Get user's vouches
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [vouchesGiven, vouchesReceived] = await Promise.all([
    prisma.vouch.findMany({
      where: { voucherId: session.user.id },
      include: {
        vouchee: {
          select: { id: true, name: true, email: true, avatarUrl: true, flavor: true }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.vouch.findMany({
      where: { voucheeId: session.user.id },
      include: {
        voucher: {
          select: { id: true, name: true, email: true, avatarUrl: true, flavor: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return NextResponse.json({ vouchesGiven, vouchesReceived });
}
