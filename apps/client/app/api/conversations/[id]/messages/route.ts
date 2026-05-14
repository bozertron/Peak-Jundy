import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/conversations/[id]/messages - Get message history
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || "50");

  // Verify user is participant
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: params.id,
      participants: { some: { id: session.user.id } }
    }
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: params.id },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } }
    }
  });

  const hasMore = messages.length > limit;
  const items = hasMore ? messages.slice(0, -1) : messages;

  return NextResponse.json({
    messages: items.reverse(), // Chronological order
    nextCursor: hasMore ? items[0].id : null,
    hasMore
  });
}

// POST /api/conversations/[id]/messages - Persist a message
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content, clientMessageId } = await request.json();

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  // Verify user is participant
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: params.id,
      participants: { some: { id: session.user.id } }
    }
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Check for duplicate (idempotency)
  if (clientMessageId) {
    const existing = await prisma.message.findFirst({
      where: { id: clientMessageId }
    });
    if (existing) {
      return NextResponse.json({ message: existing, duplicate: true });
    }
  }

  const message = await prisma.message.create({
    data: {
      id: clientMessageId || undefined,
      conversationId: params.id,
      senderId: session.user.id,
      content: content.trim()
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } }
    }
  });

  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: params.id },
    data: { updatedAt: new Date() }
  });

  return NextResponse.json({ message }, { status: 201 });
}
