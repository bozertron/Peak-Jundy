/**
 * Conversations API Routes
 * GET /api/conversations - List user's conversations with last message preview
 * POST /api/conversations - Create new conversation (optionally linked to equipment)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ============================================================================
// TypeScript Types
// ============================================================================

interface ParticipantInfo {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

interface EquipmentInfo {
  id: string;
  title: string;
  image: string | null;
  dailyRate: number;
}

interface LastMessagePreview {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  read: boolean;
}

interface ConversationListItem {
  id: string;
  participants: ParticipantInfo[];
  equipment: EquipmentInfo | null;
  lastMessage: LastMessagePreview | null;
  unreadCount: number;
  updatedAt: Date;
  createdAt: Date;
}

interface ConversationListResponse {
  conversations: ConversationListItem[];
  totalCount: number;
}

interface CreateConversationRequest {
  participantId: string;
  equipmentId?: string;
  initialMessage?: string;
}

interface CreateConversationResponse {
  conversation: {
    id: string;
    participants: ParticipantInfo[];
    equipment: EquipmentInfo | null;
    createdAt: Date;
    updatedAt: Date;
  };
  existing: boolean;
  messageId?: string;
}

interface ErrorResponse {
  error: string;
  code?: string;
}

// ============================================================================
// GET /api/conversations - List user's conversations
// ============================================================================

export async function GET(): Promise<NextResponse<ConversationListResponse | ErrorResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch conversations with participants, equipment, and last message
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { id: userId } }
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            flavor: true,
            locationName: true
          }
        },
        equipment: {
          select: {
            id: true,
            title: true,
            image: true,
            dailyRate: true
          }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            read: true
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: userId },
                read: false
              }
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    // Format response with unread counts and filtered participants
    const formattedConversations: ConversationListItem[] = conversations.map((conv) => {
      // Filter out current user from participants list for display
      const otherParticipants = conv.participants.filter(
        (p) => p.id !== userId
      );

      return {
        id: conv.id,
        participants: otherParticipants,
        equipment: conv.equipment,
        lastMessage: conv.messages[0] ?? null,
        unreadCount: conv._count.messages,
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt
      };
    });

    return NextResponse.json({
      conversations: formattedConversations,
      totalCount: formattedConversations.length
    });
  } catch (error) {
    console.error("[GET /api/conversations] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations", code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/conversations - Create new conversation
// ============================================================================

export async function POST(
  request: Request
): Promise<NextResponse<CreateConversationResponse | ErrorResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    let body: CreateConversationRequest;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body", code: "INVALID_BODY" },
        { status: 400 }
      );
    }

    const { participantId, equipmentId, initialMessage } = body;

    // Validate required fields
    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID is required", code: "MISSING_PARTICIPANT" },
        { status: 400 }
      );
    }

    // Cannot start conversation with yourself
    if (participantId === userId) {
      return NextResponse.json(
        { error: "Cannot create conversation with yourself", code: "SELF_CONVERSATION" },
        { status: 400 }
      );
    }

    // Verify participant exists
    const participant = await prisma.user.findUnique({
      where: { id: participantId },
      select: { id: true, name: true }
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found", code: "PARTICIPANT_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Verify participant is in trust network (direct vouch connection)
    const trustConnection = await prisma.vouch.findFirst({
      where: {
        OR: [
          { voucherId: userId, voucheeId: participantId, broadcast: true },
          { voucherId: participantId, voucheeId: userId, broadcast: true }
        ]
      }
    });

    // Also check extended network via contact cards
    if (!trustConnection) {
      const hasContactCard = await prisma.contactCard.findFirst({
        where: {
          collectorId: userId,
          subjectId: participantId
        }
      });

      if (!hasContactCard) {
        return NextResponse.json(
          { error: "User not in your network", code: "NOT_IN_NETWORK" },
          { status: 403 }
        );
      }
    }

    // Validate equipment if provided
    if (equipmentId) {
      const equipment = await prisma.equipment.findUnique({
        where: { id: equipmentId },
        select: { id: true, ownerId: true }
      });

      if (!equipment) {
        return NextResponse.json(
          { error: "Equipment not found", code: "EQUIPMENT_NOT_FOUND" },
          { status: 404 }
        );
      }

      // Equipment conversations should involve the owner
      if (equipment.ownerId !== userId && equipment.ownerId !== participantId) {
        return NextResponse.json(
          { error: "Equipment owner must be a participant", code: "INVALID_EQUIPMENT_CONVERSATION" },
          { status: 400 }
        );
      }
    }

    // Check for existing conversation between these users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: userId } } },
          { participants: { some: { id: participantId } } },
          // If equipmentId provided, match it; otherwise find general conversation
          equipmentId ? { equipmentId } : { equipmentId: null }
        ]
      },
      include: {
        participants: {
          select: { id: true, name: true, avatarUrl: true, flavor: true, locationName: true }
        },
        equipment: {
          select: { id: true, title: true, image: true, dailyRate: true }
        }
      }
    });

    if (existingConversation) {
      // Return existing conversation
      const otherParticipants = existingConversation.participants.filter(
        (p) => p.id !== userId
      );

      return NextResponse.json({
        conversation: {
          id: existingConversation.id,
          participants: otherParticipants,
          equipment: existingConversation.equipment,
          createdAt: existingConversation.createdAt,
          updatedAt: existingConversation.updatedAt
        },
        existing: true
      });
    }

    // Create new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        participants: {
          connect: [{ id: userId }, { id: participantId }]
        },
        equipmentId: equipmentId ?? undefined
      },
      include: {
        participants: {
          select: { id: true, name: true, avatarUrl: true, flavor: true, locationName: true }
        },
        equipment: {
          select: { id: true, title: true, image: true, dailyRate: true }
        }
      }
    });

    let messageId: string | undefined;

    // Create initial message if provided
    if (initialMessage && initialMessage.trim()) {
      const message = await prisma.message.create({
        data: {
          conversationId: newConversation.id,
          senderId: userId,
          content: initialMessage.trim()
        }
      });
      messageId = message.id;

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: newConversation.id },
        data: { updatedAt: new Date() }
      });
    }

    // Create mutual contact cards for first-time conversations
    await prisma.contactCard.createMany({
      data: [
        { collectorId: userId, subjectId: participantId, origin: "conversation" },
        { collectorId: participantId, subjectId: userId, origin: "conversation" }
      ],
      skipDuplicates: true
    });

    // Filter out current user from response
    const otherParticipants = newConversation.participants.filter(
      (p) => p.id !== userId
    );

    return NextResponse.json(
      {
        conversation: {
          id: newConversation.id,
          participants: otherParticipants,
          equipment: newConversation.equipment,
          createdAt: newConversation.createdAt,
          updatedAt: newConversation.updatedAt
        },
        existing: false,
        messageId
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/conversations] Error:", error);
    return NextResponse.json(
      { error: "Failed to create conversation", code: "CREATE_ERROR" },
      { status: 500 }
    );
  }
}
