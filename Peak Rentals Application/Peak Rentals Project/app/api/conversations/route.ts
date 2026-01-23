import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/conversations - List user's conversations
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { id: session.user.id } }
    },
    include: {
      participants: {
        select: { id: true, name: true, avatarUrl: true }
      },
      equipment: {
        select: { id: true, title: true }
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, senderId: true }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  // Format for client
  const formatted = conversations.map(conv => ({
    id: conv.id,
    participants: conv.participants.filter(p => p.id !== session.user?.id),
    equipment: conv.equipment,
    lastMessage: conv.messages[0] || null,
    updatedAt: conv.updatedAt
  }));

  return NextResponse.json({ conversations: formatted });
}

// POST /api/conversations - Start new conversation
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { participantId, equipmentId, initialMessage } = await request.json();

  if (!participantId) {
    return NextResponse.json({ error: "Participant ID is required" }, { status: 400 });
  }

  // Verify participant is in trust network
  const trustConnection = await prisma.vouch.findFirst({
    where: {
      OR: [
        { voucherId: session.user.id, voucheeId: participantId, broadcast: true },
        { voucherId: participantId, voucheeId: session.user.id, broadcast: true }
      ]
    }
  });

  // Also check extended network (2 degrees) via contact cards
  if (!trustConnection) {
    const hasContactCard = await prisma.contactCard.findFirst({
      where: {
        collectorId: session.user.id,
        subjectId: participantId
      }
    });

    if (!hasContactCard) {
      return NextResponse.json({ error: "User not in your network" }, { status: 403 });
    }
  }

  // Check for existing conversation
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { id: session.user.id } } },
        { participants: { some: { id: participantId } } },
        equipmentId ? { equipmentId } : {}
      ]
    }
  });

  if (existing) {
    return NextResponse.json({ conversation: existing, existing: true });
  }

  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        connect: [{ id: session.user.id }, { id: participantId }]
      },
      equipmentId: equipmentId || undefined
    },
    include: {
      participants: { select: { id: true, name: true, avatarUrl: true } }
    }
  });

  // Add initial message if provided
  if (initialMessage) {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: session.user.id,
        content: initialMessage
      }
    });
  }

  // Create contact cards if not existing
  await prisma.contactCard.createMany({
    data: [
      { collectorId: session.user.id, subjectId: participantId, origin: "conversation" },
      { collectorId: participantId, subjectId: session.user.id, origin: "conversation" }
    ],
    skipDuplicates: true
  });

  return NextResponse.json({ conversation, existing: false }, { status: 201 });
}
