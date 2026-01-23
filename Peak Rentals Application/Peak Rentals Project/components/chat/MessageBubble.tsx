"use client";

import Image from "next/image";

/**
 * PEAK AESTHETIC MessageBubble Component
 *
 * Sophisticated chat message display with the warmth of a mountain lodge.
 * - Sent messages: right-aligned, forest green background, white text
 * - Received messages: left-aligned, snow white background, charcoal text
 * - Subtle shadows, rounded corners, Inter font
 */

// ============================================================================
// TYPES
// ============================================================================

interface MessageSender {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface PeakMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string | number;
  delivered?: boolean | undefined;
  read?: boolean | undefined;
  sender?: MessageSender | undefined;
}

// New API (recommended)
interface NewMessageBubbleProps {
  /** The message object containing content, timestamp, and delivery status */
  message: PeakMessage;
  /** Whether this message was sent by the current user */
  isOwn: boolean;
  /** Show the sender's avatar (for received messages) */
  showAvatar?: boolean | undefined;
  /** Show the timestamp below the message */
  showTimestamp?: boolean | undefined;
}

// Legacy API (backwards compatible with existing ChatWindow)
interface LegacyMessageBubbleProps {
  /** Message text content */
  content: string;
  /** Whether this message was sent by the current user */
  isMine: boolean;
  /** Message timestamp */
  timestamp: string | number;
  /** Whether the message was delivered */
  delivered?: boolean | undefined;
}

// Union type supporting both APIs
type MessageBubbleProps = NewMessageBubbleProps | LegacyMessageBubbleProps;

// Type guard to check which API is being used
function isLegacyProps(props: MessageBubbleProps): props is LegacyMessageBubbleProps {
  return "content" in props && "isMine" in props;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formats a timestamp into a human-readable time string
 */
function formatMessageTime(timestamp: string | number): string {
  const date = typeof timestamp === "number"
    ? new Date(timestamp)
    : new Date(timestamp);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Single checkmark icon for delivered status
 */
function DeliveredIcon({ className }: { className?: string | undefined }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-label="Delivered"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Double checkmark icon for read status
 */
function ReadIcon({ className }: { className?: string | undefined }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-label="Read"
    >
      {/* First checkmark */}
      <path
        fillRule="evenodd"
        d="M9.707 14.293a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L9 12.172l6.293-6.293a1 1 0 111.414 1.414l-7 7z"
        clipRule="evenodd"
      />
      {/* Second checkmark (offset) */}
      <path
        fillRule="evenodd"
        d="M15.707 14.293a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L15 12.172l4.293-4.293a1 1 0 111.414 1.414l-5 5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Avatar component for message senders
 */
function MessageAvatar({
  sender,
  size = 32
}: {
  sender?: MessageSender | undefined;
  size?: number | undefined;
}) {
  const initials = sender?.name?.charAt(0).toUpperCase() || "?";

  if (sender?.avatarUrl) {
    return (
      <div
        className="relative flex-shrink-0 overflow-hidden rounded-full border-2 border-peak-wood-light/30 shadow-peak-sm"
        style={{ width: size, height: size }}
      >
        <Image
          src={sender.avatarUrl}
          alt={sender.name || "User avatar"}
          width={size}
          height={size}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 rounded-full bg-peak-forest/10 flex items-center justify-center
                 border-2 border-peak-wood-light/30 shadow-peak-sm"
      style={{ width: size, height: size }}
    >
      <span className="font-serif text-peak-forest font-medium" style={{ fontSize: size * 0.4 }}>
        {initials}
      </span>
    </div>
  );
}

/**
 * Read receipt indicator showing delivered/read status
 */
function ReadReceipt({
  delivered,
  read,
  isOwn
}: {
  delivered?: boolean | undefined;
  read?: boolean | undefined;
  isOwn: boolean;
}) {
  if (!isOwn) return null;

  // Read takes precedence over delivered
  if (read) {
    return (
      <ReadIcon className="w-4 h-4 text-peak-brass" />
    );
  }

  if (delivered) {
    return (
      <DeliveredIcon className="w-3.5 h-3.5 text-white/60" />
    );
  }

  // Pending state - clock icon
  return (
    <svg
      className="w-3 h-3 text-white/40"
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-label="Sending"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * MessageBubble - PEAK AESTHETIC chat message component
 *
 * Supports two APIs:
 * 1. New API (recommended): { message, isOwn, showAvatar?, showTimestamp? }
 * 2. Legacy API: { content, isMine, timestamp, delivered? }
 *
 * @example New API
 * ```tsx
 * <MessageBubble
 *   message={msg}
 *   isOwn={msg.senderId === currentUserId}
 *   showAvatar={true}
 * />
 * ```
 *
 * @example Legacy API
 * ```tsx
 * <MessageBubble
 *   content={message.content}
 *   isMine={message.senderId !== participantId}
 *   timestamp={message.createdAt}
 *   delivered={message.delivered}
 * />
 * ```
 */
export function MessageBubble(props: MessageBubbleProps) {
  // Normalize props to new API format
  let isOwn: boolean;
  let showAvatar: boolean;
  let showTimestamp: boolean;
  let content: string;
  let timestamp: string | number;
  let delivered: boolean | undefined;
  let read: boolean | undefined;
  let sender: MessageSender | undefined;

  if (isLegacyProps(props)) {
    // Legacy API
    isOwn = props.isMine;
    showAvatar = false;
    showTimestamp = true;
    content = props.content;
    timestamp = props.timestamp;
    delivered = props.delivered;
    read = undefined;
    sender = undefined;
  } else {
    // New API
    isOwn = props.isOwn;
    showAvatar = props.showAvatar ?? true;
    showTimestamp = props.showTimestamp ?? true;
    content = props.message.content;
    timestamp = props.message.createdAt;
    delivered = props.message.delivered;
    read = props.message.read;
    sender = props.message.sender;
  }

  const formattedTime = formatMessageTime(timestamp);

  return (
    <div
      className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar for received messages */}
      {!isOwn && showAvatar && (
        <MessageAvatar sender={sender} size={32} />
      )}

      {/* Spacer when avatar is hidden but we need alignment */}
      {!isOwn && !showAvatar && (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Message bubble container */}
      <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {/* The bubble itself */}
        <div
          className={`
            relative px-4 py-2.5 font-sans
            transition-shadow duration-200
            ${isOwn
              ? "bg-peak-forest text-white rounded-2xl rounded-br-md shadow-peak-sm"
              : "bg-peak-snow text-peak-charcoal rounded-2xl rounded-bl-md shadow-peak-frame border border-peak-wood-light/10"
            }
          `}
        >
          {/* Message content */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>

          {/* Timestamp and read receipt row */}
          {showTimestamp && (
            <div
              className={`
                flex items-center gap-1.5 mt-1.5
                ${isOwn ? "justify-end" : "justify-start"}
              `}
            >
              <span
                className={`
                  text-xs
                  ${isOwn ? "text-white/60" : "text-peak-slate"}
                `}
              >
                {formattedTime}
              </span>

              {/* Read receipt for own messages */}
              <ReadReceipt
                delivered={delivered}
                read={read}
                isOwn={isOwn}
              />
            </div>
          )}
        </div>

        {/* Sender name for group chats (received messages only) */}
        {!isOwn && sender?.name && showAvatar && (
          <span className="text-xs text-peak-slate mt-1 ml-1">
            {sender.name}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default MessageBubble;
export type { MessageBubbleProps, NewMessageBubbleProps, LegacyMessageBubbleProps, MessageSender };
