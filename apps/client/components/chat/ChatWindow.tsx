"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { MessageBubble } from "./MessageBubble";

// ============================================================================
// TYPES - PEAK AESTHETIC Chat Window
// ============================================================================

interface Participant {
  id: string;
  name: string;
  avatarUrl?: string | null;
  /** Short self-description (mountain-town flair). Displayed under the name. */
  flavor?: string | null;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string | number;
  delivered?: boolean;
  read?: boolean;
}

interface Equipment {
  id: string;
  name: string;
  category?: string;
  imageUrl?: string | null;
  dailyRate?: number;
}

interface ChatWindowProps {
  /** Unique identifier for the conversation */
  conversationId: string;
  /** Array of messages in the conversation */
  messages: Message[];
  /** Participants in the conversation (excluding current user) */
  participants: Participant[];
  /** Optional linked equipment for context */
  equipment?: Equipment | null;
  /** Callback when user sends a message */
  onSendMessage: (content: string) => void | Promise<void>;
  /** Loading state for initial message load */
  isLoading?: boolean;
  /** Current user ID for determining message ownership */
  currentUserId?: string;
  /** Connection status */
  connectionStatus?: "connected" | "connecting" | "disconnected";
  /** Optional callback when typing */
  onTyping?: () => void;
}

// ============================================================================
// COMPONENT - ChatWindow
// ============================================================================

export function ChatWindow({
  conversationId,
  messages,
  participants,
  equipment,
  onSendMessage,
  isLoading = false,
  currentUserId,
  connectionStatus = "connected",
  onTyping,
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Primary participant for header display
  const primaryParticipant = participants[0];
  const otherParticipantsCount = participants.length - 1;

  // ========================================
  // Auto-scroll to bottom on new messages
  // ========================================
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Immediate scroll on conversation change
  useEffect(() => {
    scrollToBottom("instant");
  }, [conversationId, scrollToBottom]);

  // ========================================
  // Message sending
  // ========================================
  const handleSend = async () => {
    const content = input.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setInput("");

    try {
      await onSendMessage(content);
    } catch (error) {
      // Restore input on error
      setInput(content);
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ========================================
  // Typing indicator
  // ========================================
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    if (onTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onTyping();
      typingTimeoutRef.current = setTimeout(() => {
        // Typing stopped
      }, 1000);
    }
  };

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // ========================================
  // Connection status indicator
  // ========================================
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case "connected":
        return { color: "bg-green-500", text: "Connected", pulse: false };
      case "connecting":
        return { color: "bg-peak-brass", text: "Connecting...", pulse: true };
      case "disconnected":
        return { color: "bg-peak-burgundy", text: "Disconnected", pulse: false };
      default:
        return { color: "bg-peak-slate", text: "Unknown", pulse: false };
    }
  };

  const statusDisplay = getConnectionStatusDisplay();

  // ========================================
  // Render
  // ========================================
  return (
    <div className="flex flex-col h-full bg-peak-cream rounded-peak border border-peak-wood/20 shadow-peak-frame overflow-hidden">
      {/* ============================== */}
      {/* HEADER */}
      {/* ============================== */}
      <div className="flex-shrink-0 bg-peak-snow border-b border-peak-stone">
        {/* Wood accent bar at top */}
        <div className="peak-wood-accent w-full" />

        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Participant Avatar */}
            <div className="relative flex-shrink-0">
              {primaryParticipant?.avatarUrl ? (
                <Image
                  src={primaryParticipant.avatarUrl}
                  alt={primaryParticipant.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-lg object-cover border-2 border-peak-wood-light/30 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-peak-forest/10 border-2 border-peak-wood-light/30
                                flex items-center justify-center shadow-sm">
                  <span className="text-xl font-serif text-peak-forest">
                    {primaryParticipant?.name?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
              )}

            </div>

            {/* Participant Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-lg text-peak-charcoal truncate">
                {primaryParticipant?.name || "Unknown"}
              </h3>

              {/* Flavor tagline — the mountain-town one-liner from their profile */}
              {primaryParticipant?.flavor && (
                <p className="text-sm text-peak-slate italic truncate">
                  &ldquo;{primaryParticipant.flavor}&rdquo;
                </p>
              )}

              {otherParticipantsCount > 0 && (
                <p className="text-sm text-peak-slate">
                  +{otherParticipantsCount} other{otherParticipantsCount > 1 ? "s" : ""}
                </p>
              )}

              {/* Connection Status */}
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-2 h-2 rounded-full ${statusDisplay.color} ${statusDisplay.pulse ? "animate-pulse" : ""}`} />
                <span className="text-xs text-peak-slate">{statusDisplay.text}</span>
              </div>
            </div>

            {/* Equipment Context Badge */}
            {equipment && (
              <div className="flex-shrink-0">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-peak-brass/10
                                border border-peak-brass/20 max-w-[200px]">
                  {equipment.imageUrl && (
                    <Image
                      src={equipment.imageUrl}
                      alt={equipment.name}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-peak-brass truncate">
                      {equipment.category || "Equipment"}
                    </p>
                    <p className="text-sm text-peak-charcoal truncate">
                      {equipment.name}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================== */}
      {/* MESSAGES AREA */}
      {/* ============================== */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
        style={{
          background: "linear-gradient(180deg, var(--peak-cream) 0%, rgba(250, 247, 242, 0.95) 100%)",
        }}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-peak-forest/40 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2.5 h-2.5 rounded-full bg-peak-forest/40 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2.5 h-2.5 rounded-full bg-peak-forest/40 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <p className="text-sm text-peak-slate">Loading messages...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-peak-forest/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-peak-forest/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-serif text-peak-charcoal">Start the conversation</p>
              <p className="text-sm text-peak-slate mt-1">
                Send a message to {primaryParticipant?.name || "begin"}
              </p>
            </div>

            {/* Equipment context hint */}
            {equipment && (
              <div className="mt-4 px-4 py-3 rounded-lg bg-peak-snow border border-peak-brass/20 max-w-sm">
                <p className="text-xs text-peak-brass font-medium mb-1">About this equipment:</p>
                <p className="text-sm text-peak-charcoal">
                  {equipment.name}
                  {equipment.dailyRate && (
                    <span className="text-peak-forest font-medium ml-2">
                      ${(equipment.dailyRate / 100).toFixed(0)}/day
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {!isLoading && messages.length > 0 && (
          <div className="space-y-3 peak-stagger">
            {messages.map((message, index) => {
              const isMine = currentUserId ? message.senderId === currentUserId : false;
              const prevMessage = messages[index - 1];
              const showDateSeparator = index === 0 || !prevMessage || !isSameDay(
                new Date(message.createdAt),
                new Date(prevMessage.createdAt)
              );

              return (
                <div key={message.id}>
                  {/* Date Separator */}
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-4">
                      <div className="px-3 py-1 rounded-full bg-peak-snow/80 border border-peak-stone/50">
                        <span className="text-xs text-peak-slate">
                          {formatDateSeparator(new Date(message.createdAt))}
                        </span>
                      </div>
                    </div>
                  )}

                  <MessageBubble
                    content={message.content}
                    isMine={isMine}
                    timestamp={message.createdAt}
                    delivered={message.delivered}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* ============================== */}
      {/* INPUT AREA */}
      {/* ============================== */}
      <div className="flex-shrink-0 bg-peak-snow border-t border-peak-stone p-4">
        {/* Disconnected warning */}
        {connectionStatus === "disconnected" && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-peak-burgundy/10 border border-peak-burgundy/20">
            <p className="text-sm text-peak-burgundy flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              You are disconnected. Messages may not be delivered.
            </p>
          </div>
        )}

        <div className="flex gap-3 items-end">
          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={equipment ? `Message about ${equipment.name}...` : "Type a message..."}
              disabled={isSending}
              className="w-full resize-none rounded-peak border border-peak-stone bg-white px-4 py-3
                         text-peak-charcoal placeholder:text-peak-slate/60
                         focus:outline-none focus:ring-2 focus:ring-peak-forest/30 focus:border-peak-forest/50
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
              rows={1}
              style={{
                minHeight: "48px",
                maxHeight: "120px",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending || connectionStatus === "disconnected"}
            className="flex-shrink-0 w-12 h-12 rounded-peak bg-peak-forest text-white
                       flex items-center justify-center
                       hover:bg-peak-forest/90 active:scale-95
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
                       transition-all duration-200 shadow-peak-sm hover:shadow-peak"
            aria-label="Send message"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {/* Character count hint for long messages */}
        {input.length > 400 && (
          <p className={`text-xs mt-2 ${input.length > 500 ? "text-peak-burgundy" : "text-peak-slate"}`}>
            {input.length}/500 characters
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatDateSeparator(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) {
    return "Today";
  }
  if (isSameDay(date, yesterday)) {
    return "Yesterday";
  }

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { ChatWindowProps, Participant, Message, Equipment };
