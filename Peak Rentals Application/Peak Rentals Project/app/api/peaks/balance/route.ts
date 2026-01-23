// GET /api/peaks/balance - Get user's Peaks balance and history
// POST /api/peaks/balance - Award Peaks for actions

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Points values for different actions
const PEAKS_VALUES: Record<string, number> = {
  vouch_given: 5,
  vouch_received: 3,
  first_interaction: 10,
  rental_complete: 25,
  listing_created: 5,
  profile_complete: 10,
  founding_bonus: 100,
};

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeHistory = searchParams.get("history") === "true";
  const limit = parseInt(searchParams.get("limit") || "20");

  // Get user's current balance
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { peaksBalance: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let history = null;
  if (includeHistory) {
    history = await prisma.peaksTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        amount: true,
        reason: true,
        createdAt: true,
        referenceType: true,
      },
    });
  }

  return NextResponse.json({
    balance: user.peaksBalance,
    history,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reason, referenceId, referenceType } = await request.json();

  // Validate reason
  if (!reason || !PEAKS_VALUES[reason]) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const amount = PEAKS_VALUES[reason];

  // Prevent duplicate awards for same reference
  if (referenceId) {
    const existing = await prisma.peaksTransaction.findFirst({
      where: {
        userId: session.user.id,
        reason,
        referenceId,
      },
    });

    if (existing) {
      return NextResponse.json({ 
        error: "Already awarded", 
        transaction: existing 
      }, { status: 400 });
    }
  }

  // Create transaction and update balance
  const transaction = await prisma.peaksTransaction.create({
    data: {
      userId: session.user.id,
      amount,
      reason,
      referenceId,
      referenceType,
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { peaksBalance: { increment: amount } },
  });

  // Get updated balance
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { peaksBalance: true },
  });

  return NextResponse.json({
    transaction,
    balance: user?.peaksBalance || 0,
    awarded: amount,
  }, { status: 201 });
}
