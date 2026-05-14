"use client";

import { useState, useMemo } from "react";
import Image from "next/image";

// ============================================================================
// Types
// ============================================================================

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage?: string;
  lastMessageAt?: number | string;
  unreadCount?: number;
  equipment?: {
    id: string;
    name: string;
    category?: string;
  };
}

export interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatTimestamp(timestamp: number | string): string {
  const date = typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}

function truncateMessage(message: string, maxLength: number = 50): string {
  if (message.length <= maxLength) return message;
  return message.slice(0, maxLength).trim() + "...";
}

// ============================================================================
// Sub-Components
// ============================================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function EquipmentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
      />
    </svg>
  );
}

function Avatar({
  src,
  name,
  size = "md"
}: {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-lg",
    lg: "w-16 h-16 text-xl",
  };

  if (src) {
    return (
      <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden border-2 border-peak-wood-light/30`}>
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-peak-forest/10 flex items-center justify-center border-2 border-peak-wood-light/30`}
    >
      <span className="font-serif text-peak-forest font-medium">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-peak-burgundy text-white text-xs font-semibold">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function EquipmentContextBadge({ name, category }: { name: string; category?: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-peak-brass/10 border border-peak-brass/20">
      <EquipmentIcon className="w-3.5 h-3.5 text-peak-brass" />
      <span className="text-xs text-peak-charcoal truncate max-w-[120px]">
        {name}
      </span>
    </div>
  );
}

function ConversationItem({
  conversation,
  isSelected,
  onSelect,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const hasUnread = (conversation.unreadCount ?? 0) > 0;

  return (
    <button
      onClick={onSelect}
      className={`
        w-full text-left p-4 rounded-peak transition-all duration-200
        ${isSelected
          ? "bg-peak-forest/10 border-l-4 border-peak-forest shadow-peak-sm"
          : "bg-peak-snow hover:bg-peak-cream border-l-4 border-transparent"
        }
        ${hasUnread && !isSelected ? "bg-peak-cream/80" : ""}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <Avatar
            src={conversation.participantAvatar}
            name={conversation.participantName}
            size="md"
          />
          {/* Online indicator could go here */}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row: Name + Timestamp */}
          <div className="flex items-center justify-between gap-2">
            <h4
              className={`font-serif truncate ${
                hasUnread ? "text-peak-charcoal font-semibold" : "text-peak-charcoal"
              }`}
            >
              {conversation.participantName}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              {conversation.lastMessageAt && (
                <span className={`text-xs ${hasUnread ? "text-peak-forest font-medium" : "text-peak-slate"}`}>
                  {formatTimestamp(conversation.lastMessageAt)}
                </span>
              )}
            </div>
          </div>

          {/* Last message preview */}
          {conversation.lastMessage && (
            <p
              className={`text-sm mt-1 line-clamp-2 ${
                hasUnread ? "text-peak-charcoal" : "text-peak-slate"
              }`}
            >
              {truncateMessage(conversation.lastMessage, 60)}
            </p>
          )}

          {/* Bottom row: Equipment context + Unread badge */}
          <div className="flex items-center justify-between gap-2 mt-2">
            {conversation.equipment ? (
              <EquipmentContextBadge
                name={conversation.equipment.name}
                category={conversation.equipment.category}
              />
            ) : (
              <div />
            )}
            <UnreadBadge count={conversation.unreadCount ?? 0} />
          </div>
        </div>
      </div>
    </button>
  );
}

function LoadingState() {
  return (
    <div className="p-4 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-peak-stone" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-peak-stone rounded w-3/4" />
            <div className="h-3 bg-peak-stone rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasSearchQuery }: { hasSearchQuery: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-peak-forest/10 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-peak-forest/60"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
          />
        </svg>
      </div>
      <h3 className="font-serif text-lg text-peak-charcoal mb-2">
        {hasSearchQuery ? "No conversations found" : "No conversations yet"}
      </h3>
      <p className="text-sm text-peak-slate max-w-[220px]">
        {hasSearchQuery
          ? "Try adjusting your search query to find what you're looking for."
          : "Start a conversation by reaching out to equipment owners or renters."
        }
      </p>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading = false,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const nameMatch = conv.participantName.toLowerCase().includes(query);
      const messageMatch = conv.lastMessage?.toLowerCase().includes(query);
      const equipmentMatch = conv.equipment?.name.toLowerCase().includes(query);
      return nameMatch || messageMatch || equipmentMatch;
    });
  }, [conversations, searchQuery]);

  // Sort by most recent
  const sortedConversations = useMemo(() => {
    return [...filteredConversations].sort((a, b) => {
      const aTime = a.lastMessageAt
        ? new Date(a.lastMessageAt).getTime()
        : 0;
      const bTime = b.lastMessageAt
        ? new Date(b.lastMessageAt).getTime()
        : 0;
      return bTime - aTime;
    });
  }, [filteredConversations]);

  return (
    <div className="flex flex-col h-full bg-peak-snow rounded-lg border border-peak-wood/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-peak-wood/10">
        <h2 className="font-serif text-xl text-peak-charcoal mb-3">Messages</h2>

        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-peak-slate" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2.5 rounded-peak border border-peak-stone bg-white
                       text-peak-charcoal placeholder:text-peak-slate/60
                       focus:outline-none focus:ring-2 focus:ring-peak-forest/30 focus:border-peak-forest/50
                       transition-all duration-200 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full
                         bg-peak-stone/50 hover:bg-peak-stone flex items-center justify-center
                         transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-3 h-3 text-peak-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <LoadingState />
        ) : sortedConversations.length === 0 ? (
          <EmptyState hasSearchQuery={searchQuery.length > 0} />
        ) : (
          <div className="divide-y divide-peak-stone/50">
            {sortedConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === selectedId}
                onSelect={() => onSelect(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with conversation count */}
      {!isLoading && sortedConversations.length > 0 && (
        <div className="p-3 border-t border-peak-wood/10 bg-peak-cream/50">
          <p className="text-xs text-peak-slate text-center">
            {sortedConversations.length} conversation{sortedConversations.length !== 1 ? "s" : ""}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      )}
    </div>
  );
}

export default ConversationList;
