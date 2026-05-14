/**
 * Single Conversation API Route
 * GET /api/conversations/[id] - Get conversation details with messages
 * DELETE /api/conversations/[id] - Leave/delete conversation
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// TypeScript interfaces for response types
interface ParticipantInfo {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  flavor: string | null;
  locationName: string | null;
}

interface MessageInfo {
  id: string;
  createdAt: Date;
  content: string;
  senderId: string;
  delivered: boolean;
  read: boolean;
  sender: ParticipantInfo;
}

interface EquipmentInfo {
  id: string;
  title: string;
  category: string;
  dailyRate: number;
  image: string | null;
  location: string | null;
  owner: {
    id: string;
    name: string | null;
  };
}

interface ConversationDetail {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  participants: ParticipantInfo[];
  equipment: EquipmentInfo | null;
  messages: MessageInfo[];
  unreadCount: number;
}

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/conversations/[id]
 * Retrieves a single conversation with all messages, participants, and linked equipment.
 * Marks all unread messages from other participants as read.
 */
export async function GET(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversationId = params.id;

    // Fetch conversation with full details
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            flavor: true,
            locationName: true,
          },
        },
        equipment: {
          select: {
            id: true,
            title: true,
            category: true,
            dailyRate: true,
            image: true,
            location: true,
            owner: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                flavor: true,
                locationName: true,
              },
            },
          },
        },
      },
    });

    // Return 404 if conversation doesn't exist
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Verify user is a participant - return 403 if not
    const isParticipant = conversation.participants.some(
      (p) => p.id === session.user?.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: "You are not a participant in this conversation" },
        { status: 403 }
      );
    }

    // Count unread messages (from other participants)
    const unreadCount = conversation.messages.filter(
      (m) => !m.read && m.senderId !== session.user?.id
    ).length;

    // Mark all unread messages from other participants as read
    if (unreadCount > 0) {
      await prisma.message.updateMany({
        where: {
          conversationId: conversationId,
          senderId: { not: session.user.id },
          read: false,
        },
        data: {
          read: true,
        },
      });
    }

    // Format response
    const response: ConversationDetail = {
      id: conversation.id,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      participants: conversation.participants as ParticipantInfo[],
      equipment: conversation.equipment as EquipmentInfo | null,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        createdAt: m.createdAt,
        content: m.content,
        senderId: m.senderId,
        delivered: m.delivered,
        read: m.senderId === session.user?.id ? m.read : true, // Mark as read since we just viewed
        sender: m.sender as ParticipantInfo,
      })),
      unreadCount: 0, // Reset to 0 since we just marked all as read
    };

    return NextResponse.json({ conversation: response });
  } catch (error) {
    console.error("GET /api/conversations/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversations/[id]
 * Allows a user to leave/delete a conversation.
 * - For 2-person conversations: Deletes the entire conversation
 * - For group conversations: Removes the user from participants (future extension)
 */
export async function DELETE(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversationId = params.id;

    // Fetch conversation with participants
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          select: { id: true },
        },
      },
    });

    // Return 404 if conversation doesn't exist
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Verify user is a participant - return 403 if not
    const isParticipant = conversation.participants.some(
      (p) => p.id === session.user?.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: "You are not a participant in this conversation" },
        { status: 403 }
      );
    }

    // For 2-person DM conversations, delete the entire conversation
    // Messages are deleted via onDelete: Cascade in the schema
    if (conversation.participants.length <= 2) {
      await prisma.conversation.delete({
        where: { id: conversationId },
      });

      return NextResponse.json({
        message: "Conversation deleted successfully",
        deleted: true,
      });
    }

    // For group conversations (future extension): remove user from participants
    // This allows the conversation to continue without this user
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        participants: {
          disconnect: { id: session.user.id },
        },
      },
    });

    return NextResponse.json({
      message: "You have left the conversation",
      deleted: false,
      left: true,
    });
  } catch (error) {
    console.error("DELETE /api/conversations/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
