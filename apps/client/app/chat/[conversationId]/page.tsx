"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChatWindow, type Message, type Participant, type Equipment } from "@/components/chat/ChatWindow";
import { ConversationList, type Conversation as ConversationListItem } from "@/components/chat/ConversationList";
import { PeakButton } from "@/components/ui/peak-button";
import { PeakCard } from "@/components/ui/peak-card";
import {
  WebLinkClient,
  type ConnectionState,
  type PeakMessage as WebLinkMessage,
} from "@/lib/weblink";

// ============================================================================
// TYPES
// ============================================================================

interface ConversationData {
  id: string;
  participants: Array<{
    id: string;
    name: string | null;
    avatarUrl: string | null;
    flavor: string | null;
    locationName: string | null;
  }>;
  equipment?: {
    id: string;
    title: string;
    image: string | null;
    dailyRate: number;
  } | null;
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
}

interface APIMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  delivered?: boolean;
  read?: boolean;
  sender?: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const POLLING_INTERVAL = 3000; // 3 seconds
const MESSAGE_FETCH_LIMIT = 50;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ChatConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  // Conversation state
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time state
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting");
  const webLinkRef = useRef<WebLinkClient | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const conversationId = params.conversationId as string;
  const currentUserId = session?.user?.id;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch conversation details from the API
   */
  const fetchConversation = useCallback(async () => {
    if (!conversationId || authStatus !== "authenticated") return;

    try {
      // Fetch all conversations and find the current one
      // Note: Ideally there would be a /api/conversations/[id] endpoint
      const res = await fetch("/api/conversations");
      if (!res.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const data = await res.json();
      const convList = data.conversations || [];

      // Find the current conversation
      const currentConv = convList.find((c: ConversationData) => c.id === conversationId);

      if (!currentConv) {
        setError("Conversation not found");
        return;
      }

      setConversation(currentConv);

      // Format conversations for the sidebar list
      const formattedConversations: ConversationListItem[] = convList.map((conv: ConversationData) => ({
        id: conv.id,
        participantId: conv.participants[0]?.id || "",
        participantName: conv.participants[0]?.name || "Unknown",
        participantAvatar: conv.participants[0]?.avatarUrl || undefined,
        lastMessage: conv.lastMessage?.content,
        lastMessageAt: conv.lastMessage?.createdAt || conv.updatedAt,
        unreadCount: conv.unreadCount,
        equipment: conv.equipment ? {
          id: conv.equipment.id,
          name: conv.equipment.title,
          category: undefined,
        } : undefined,
      }));

      setConversations(formattedConversations);
    } catch (err) {
      console.error("Error fetching conversation:", err);
      setError(err instanceof Error ? err.message : "Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, authStatus]);

  /**
   * Fetch messages for the current conversation
   */
  const fetchMessages = useCallback(async (isPolling = false) => {
    if (!conversationId || authStatus !== "authenticated") return;

    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages?limit=${MESSAGE_FETCH_LIMIT}`
      );

      if (!res.ok) {
        if (res.status === 404) {
          setError("Conversation not found");
          return;
        }
        throw new Error("Failed to fetch messages");
      }

      const data = await res.json();
      const apiMessages: APIMessage[] = data.messages || [];

      // Transform API messages to ChatWindow Message format
      const transformedMessages: Message[] = apiMessages.map((msg: APIMessage): Message => ({
        id: msg.id,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: msg.createdAt,
        delivered: msg.delivered ?? true,
        read: msg.read ?? false,
      }));

      // Check if there are new messages (for polling)
      if (isPolling && transformedMessages.length > 0) {
        const lastMessage = transformedMessages[transformedMessages.length - 1];
        const latestId = lastMessage?.id;
        if (latestId && latestId !== lastMessageIdRef.current) {
          // New messages arrived
          setMessages(transformedMessages);
          lastMessageIdRef.current = latestId;
        }
      } else {
        setMessages(transformedMessages);
        if (transformedMessages.length > 0) {
          const lastMessage = transformedMessages[transformedMessages.length - 1];
          if (lastMessage) {
            lastMessageIdRef.current = lastMessage.id;
          }
        }
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      if (!isPolling) {
        setError(err instanceof Error ? err.message : "Failed to load messages");
      }
    } finally {
      if (!isPolling) {
        setIsLoadingMessages(false);
      }
    }
  }, [conversationId, authStatus]);

  /**
   * Send a new message
   */
  const handleSendMessage = useCallback(async (content: string) => {
    if (!conversationId || !content.trim()) return;

    // Optimistically add message to UI
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId || "",
      content: content.trim(),
      createdAt: new Date().toISOString(),
      delivered: false,
    };

    setMessages((prev: Message[]) => [...prev, optimisticMessage]);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const data = await res.json();
      const sentMessage = data.message;

      // Replace optimistic message with real one
      setMessages((prev: Message[]) =>
        prev.map((msg: Message) =>
          msg.id === optimisticMessage.id
            ? {
                id: sentMessage.id,
                senderId: sentMessage.senderId,
                content: sentMessage.content,
                createdAt: sentMessage.createdAt,
                delivered: true,
              }
            : msg
        )
      );

      lastMessageIdRef.current = sentMessage.id;
    } catch (err) {
      console.error("Error sending message:", err);
      // Remove optimistic message on error
      setMessages((prev: Message[]) => prev.filter((msg: Message) => msg.id !== optimisticMessage.id));
      throw err; // Let ChatWindow handle the error
    }
  }, [conversationId, currentUserId]);

  // ============================================================================
  // REAL-TIME UPDATES
  // ============================================================================

  /**
   * Initialize WebLink for real-time messaging (optional)
   */
  const initializeWebLink = useCallback(() => {
    if (!currentUserId || webLinkRef.current) return;

    try {
      const weblink = new WebLinkClient({
        userId: currentUserId,
        onMessage: (message: WebLinkMessage) => {
          // Handle incoming real-time message
          if (message.conversationId === conversationId) {
            const newMessage: Message = {
              id: message.id,
              senderId: message.senderId,
              content: message.content,
              createdAt: message.timestamp,
              delivered: message.delivered,
              read: message.read,
            };
            setMessages((prev: Message[]) => {
              // Avoid duplicates
              if (prev.some((m: Message) => m.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });
            lastMessageIdRef.current = message.id;
          }
        },
        onConnectionStateChange: (state: ConnectionState) => {
          if (state === "connected") {
            setConnectionStatus("connected");
          } else if (state === "connecting" || state === "reconnecting") {
            setConnectionStatus("connecting");
          } else {
            setConnectionStatus("disconnected");
          }
        },
        onError: (error) => {
          console.error("WebLink error:", error);
          // Fall back to polling on WebLink error
          startPolling();
        },
        debug: process.env.NODE_ENV === "development",
      });

      weblink.connect();
      webLinkRef.current = weblink;
    } catch (err) {
      console.error("Failed to initialize WebLink, falling back to polling:", err);
      startPolling();
    }
  }, [currentUserId, conversationId]);

  /**
   * Start polling for new messages (fallback for real-time)
   */
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;

    setConnectionStatus("connected");
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages(true);
    }, POLLING_INTERVAL);
  }, [fetchMessages]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Fetch conversation and messages on mount
  useEffect(() => {
    fetchConversation();
    fetchMessages();
  }, [fetchConversation, fetchMessages]);

  // Initialize real-time updates
  useEffect(() => {
    if (authStatus === "authenticated" && currentUserId) {
      // Try WebLink first, fall back to polling
      try {
        initializeWebLink();
      } catch {
        startPolling();
      }

      // If WebLink doesn't connect within 5 seconds, start polling
      const fallbackTimer = setTimeout(() => {
        if (connectionStatus !== "connected" && !pollingIntervalRef.current) {
          startPolling();
        }
      }, 5000);

      return () => {
        clearTimeout(fallbackTimer);
        stopPolling();
        if (webLinkRef.current) {
          webLinkRef.current.disconnect();
          webLinkRef.current = null;
        }
      };
    }
  }, [authStatus, currentUserId, initializeWebLink, startPolling, stopPolling, connectionStatus]);

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const handleConversationSelect = (id: string) => {
    setIsSidebarOpen(false);
    router.push(`/chat/${id}`);
  };

  const handleBackClick = () => {
    router.back();
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  // Unauthenticated state
  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-peak-cream flex items-center justify-center">
        <PeakCard variant="elevated" padding="lg" className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-peak-forest/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-peak-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-bold text-peak-charcoal mb-2">
            Peak Messages
          </h1>
          <p className="text-peak-slate mb-6">
            Sign in to access your conversations and connect with the Peak community.
          </p>
          <Link href="/auth/signin">
            <PeakButton variant="primary" size="lg" fullWidth>
              Sign In to Continue
            </PeakButton>
          </Link>
        </PeakCard>
      </div>
    );
  }

  // Loading state
  if (authStatus === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-peak-cream flex items-center justify-center">
        <div className="text-center">
          <div className="flex space-x-2 justify-center mb-4">
            <div className="w-3 h-3 rounded-full bg-peak-forest/40 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-3 h-3 rounded-full bg-peak-forest/40 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-3 h-3 rounded-full bg-peak-forest/40 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <p className="text-peak-slate font-medium">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-peak-cream flex items-center justify-center p-4">
        <PeakCard variant="elevated" padding="lg" className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-peak-burgundy/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-peak-burgundy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-bold text-peak-charcoal mb-2">
            {error || "Conversation Not Found"}
          </h1>
          <p className="text-peak-slate mb-6">
            We couldn&apos;t load this conversation. It may have been deleted or you may not have access.
          </p>
          <div className="flex gap-3 justify-center">
            <PeakButton variant="secondary" onClick={handleBackClick}>
              Go Back
            </PeakButton>
            <Link href="/cards">
              <PeakButton variant="primary">
                View Cards
              </PeakButton>
            </Link>
          </div>
        </PeakCard>
      </div>
    );
  }

  // Get participant info
  type ConversationParticipant = ConversationData["participants"][number];
  const otherParticipants: Participant[] = conversation.participants
    .filter((p: ConversationParticipant) => p.id !== currentUserId)
    .map((p: ConversationParticipant): Participant => ({
      id: p.id,
      name: p.name || "Unknown",
      avatarUrl: p.avatarUrl,
      flavor: p.flavor ?? null,
    }));

  const primaryParticipant = otherParticipants[0];

  // Format equipment for ChatWindow
  const equipment: Equipment | null = conversation.equipment
    ? {
        id: conversation.equipment.id,
        name: conversation.equipment.title,
        imageUrl: conversation.equipment.image,
        dailyRate: conversation.equipment.dailyRate,
      }
    : null;

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="h-screen flex flex-col bg-peak-cream">
      {/* ================================================================== */}
      {/* HEADER */}
      {/* ================================================================== */}
      <header className="flex-shrink-0 bg-peak-snow border-b border-peak-wood/20 shadow-sm z-20">
        {/* PEAK wood accent */}
        <div className="h-1 bg-gradient-to-r from-peak-wood via-peak-brass to-peak-wood" />

        <div className="px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            {/* Mobile: Back button */}
            <button
              onClick={handleBackClick}
              className="lg:hidden flex items-center gap-2 text-peak-charcoal/70 hover:text-peak-charcoal transition-colors"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">^</span>
              <span className="font-serif text-xl font-bold text-peak-charcoal hidden sm:inline">
                Peak
              </span>
            </Link>

            {/* Participant info (mobile) */}
            <div className="flex-1 lg:hidden">
              <div className="flex items-center gap-3">
                {primaryParticipant?.avatarUrl ? (
                  <Image
                    src={primaryParticipant.avatarUrl}
                    alt={primaryParticipant.name}
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full object-cover border-2 border-peak-wood-light/30"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-peak-forest/10 flex items-center justify-center border-2 border-peak-wood-light/30">
                    <span className="font-serif text-peak-forest font-medium">
                      {primaryParticipant?.name?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="font-serif text-base font-semibold text-peak-charcoal truncate">
                    {primaryParticipant?.name || "Unknown"}
                  </h1>
                  {/* Connection status */}
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${
                      connectionStatus === "connected" ? "bg-green-500" :
                      connectionStatus === "connecting" ? "bg-peak-brass animate-pulse" :
                      "bg-peak-burgundy"
                    }`} />
                    <span className="text-xs text-peak-slate">
                      {connectionStatus === "connected" ? "Connected" :
                       connectionStatus === "connecting" ? "Connecting..." : "Offline"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden lg:flex items-center gap-6 flex-1 justify-end">
              <Link
                href="/browse"
                className="text-sm text-peak-charcoal/70 hover:text-peak-charcoal transition-colors"
              >
                Browse
              </Link>
              <Link
                href="/map"
                className="text-sm text-peak-charcoal/70 hover:text-peak-charcoal transition-colors"
              >
                Map
              </Link>
              <Link
                href="/cards"
                className="text-sm text-peak-charcoal/70 hover:text-peak-charcoal transition-colors"
              >
                Cards
              </Link>
              <Link
                href="/network"
                className="text-sm text-peak-charcoal/70 hover:text-peak-charcoal transition-colors"
              >
                Network
              </Link>
            </nav>

            {/* Mobile: Sidebar toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-peak-charcoal/70 hover:text-peak-charcoal transition-colors"
              aria-label="Toggle conversations"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Equipment context banner */}
        {conversation.equipment && (
          <div className="bg-peak-brass/5 border-t border-peak-brass/10 px-4 py-2">
            <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-peak-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <span className="text-peak-charcoal/60">Discussing:</span>
              <Link
                href={`/equipment/${conversation.equipment.id}`}
                className="text-peak-forest hover:underline font-medium truncate"
              >
                {conversation.equipment.title}
              </Link>
              {conversation.equipment.dailyRate && (
                <span className="text-peak-brass font-semibold ml-auto">
                  ${(conversation.equipment.dailyRate / 100).toFixed(0)}/day
                </span>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ================================================================== */}
      {/* MAIN CONTENT */}
      {/* ================================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar - Conversation List */}
        <aside className="hidden lg:block w-80 xl:w-96 border-r border-peak-wood/20 bg-peak-snow overflow-hidden flex-shrink-0">
          <ConversationList
            conversations={conversations}
            selectedId={conversationId}
            onSelect={handleConversationSelect}
            isLoading={false}
          />
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              className="lg:hidden fixed inset-0 bg-peak-charcoal/50 z-30"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Sidebar */}
            <aside className="lg:hidden fixed inset-y-0 left-0 w-80 bg-peak-snow shadow-xl z-40 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-peak-wood/20">
                <h2 className="font-serif text-lg font-bold text-peak-charcoal">
                  Conversations
                </h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-peak-charcoal/60 hover:text-peak-charcoal transition-colors"
                  aria-label="Close sidebar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ConversationList
                  conversations={conversations}
                  selectedId={conversationId}
                  onSelect={handleConversationSelect}
                  isLoading={false}
                />
              </div>
            </aside>
          </>
        )}

        {/* Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-4 lg:p-6 overflow-hidden">
            <div className="h-full max-w-4xl mx-auto">
              <ChatWindow
                conversationId={conversationId}
                messages={messages}
                participants={otherParticipants}
                equipment={equipment}
                onSendMessage={handleSendMessage}
                isLoading={isLoadingMessages}
                currentUserId={currentUserId}
                connectionStatus={connectionStatus}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
