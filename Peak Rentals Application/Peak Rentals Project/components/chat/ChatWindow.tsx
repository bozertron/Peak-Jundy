"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useChat } from "./ChatProvider";
import { MessageBubble } from "./MessageBubble";

interface ChatWindowProps {
  conversationId: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
}

export function ChatWindow({ 
  conversationId, 
  participantId, 
  participantName,
  participantAvatar 
}: ChatWindowProps) {
  const { sendMessage, messages, loadMessages, markAsRead } = useChat();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load message history
  useEffect(() => {
    loadMessages(conversationId);
    markAsRead(conversationId);
  }, [conversationId, loadMessages, markAsRead]);

  const allMessages = messages.get(conversationId) || [];

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    await sendMessage(conversationId, input.trim());
    setInput("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-peak-cream rounded-lg border border-peak-wood/20">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-peak-wood/10">
        {participantAvatar ? (
          <Image src={participantAvatar} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-peak-forest/20 flex items-center justify-center">
            <span className="text-peak-forest font-medium">
              {participantName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-serif text-peak-charcoal">{participantName}</h3>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {allMessages.map((message) => (
          <MessageBubble
            key={message.id}
            content={message.content}
            isMine={message.senderId !== participantId}
            timestamp={message.createdAt}
            delivered={message.delivered}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-peak-wood/10">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 resize-none rounded-lg border border-peak-wood/20 bg-white p-3 
                       focus:outline-none focus:ring-2 focus:ring-peak-forest/30
                       placeholder:text-peak-charcoal/40 text-peak-charcoal"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="self-end px-4 py-2 rounded-lg bg-peak-forest text-white font-medium
                       hover:bg-peak-forest/90 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
