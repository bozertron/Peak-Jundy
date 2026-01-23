// GET /api/peaks/chest - List available treasure chests
// POST /api/peaks/chest - Open/claim a treasure chest

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
  const includeClaimedBy = searchParams.get("mine") === "true";

  // Get available chests or user's claimed chests
  const where = includeClaimedBy
    ? { claimedBy: session.user.id }
    : { available: true };

  const chests = await prisma.treasureChest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      peaksCost: true,
      prizeType: true,
      available: true,
      createdAt: true,
      claimedAt: true,
      // Only show prize value if claimed by current user
      ...(includeClaimedBy ? { prizeValue: true } : {}),
    },
  });

  // Get user's balance to check affordability
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { peaksBalance: true },
  });

  return NextResponse.json({
    chests,
    userBalance: user?.peaksBalance || 0,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chestId } = await request.json();

  if (!chestId) {
    return NextResponse.json({ error: "Chest ID is required" }, { status: 400 });
  }

  // Get the chest
  const chest = await prisma.treasureChest.findUnique({
    where: { id: chestId },
  });

  if (!chest) {
    return NextResponse.json({ error: "Chest not found" }, { status: 404 });
  }

  if (!chest.available) {
    return NextResponse.json({ error: "Chest already claimed" }, { status: 400 });
  }

  // Check user's balance
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { peaksBalance: true },
  });

  if (!user || user.peaksBalance < chest.peaksCost) {
    return NextResponse.json({ 
      error: "Insufficient Peaks balance",
      required: chest.peaksCost,
      current: user?.peaksBalance || 0,
    }, { status: 400 });
  }

  // Claim the chest (transaction)
  const [updatedChest] = await prisma.$transaction([
    // Mark chest as claimed
    prisma.treasureChest.update({
      where: { id: chestId },
      data: {
        available: false,
        claimedBy: session.user.id,
        claimedAt: new Date(),
      },
    }),
    // Deduct Peaks from user
    prisma.user.update({
      where: { id: session.user.id },
      data: { peaksBalance: { decrement: chest.peaksCost } },
    }),
    // Record transaction
    prisma.peaksTransaction.create({
      data: {
        userId: session.user.id,
        amount: -chest.peaksCost,
        reason: "chest_opened",
        referenceId: chestId,
        referenceType: "chest",
      },
    }),
  ]);

  // Parse prize value
  let prize;
  try {
    prize = JSON.parse(updatedChest.prizeValue);
  } catch {
    prize = { description: updatedChest.prizeValue };
  }

  return NextResponse.json({
    success: true,
    chest: {
      id: updatedChest.id,
      title: updatedChest.title,
      prizeType: updatedChest.prizeType,
      prize,
    },
    newBalance: user.peaksBalance - chest.peaksCost,
  });
}

// Admin endpoint to create chests
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { title, description, peaksCost, prizeType, prizeValue } = await request.json();

  if (!title || !description || !peaksCost || !prizeType || !prizeValue) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const chest = await prisma.treasureChest.create({
    data: {
      title,
      description,
      peaksCost,
      prizeType,
      prizeValue: typeof prizeValue === "string" ? prizeValue : JSON.stringify(prizeValue),
      available: true,
    },
  });

  return NextResponse.json({ chest }, { status: 201 });
}
