"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface PeakMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string | number;
  delivered?: boolean;
  read?: boolean;
  sender?: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

interface ChatContextType {
  isConnected: boolean;
  sendMessage: (conversationId: string, content: string) => Promise<PeakMessage | null>;
  messages: Map<string, PeakMessage[]>;
  loadMessages: (conversationId: string) => Promise<void>;
  markAsRead: (conversationId: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Map<string, PeakMessage[]>>(new Map());

  useEffect(() => {
    if (session?.user?.id) {
      setIsConnected(true);
    }
    return () => {
      setIsConnected(false);
    };
  }, [session?.user?.id]);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await res.json();
      if (data.messages) {
        setMessages(prev => {
          const copy = new Map(prev);
          copy.set(conversationId, data.messages);
          return copy;
        });
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  }, []);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });

      const data = await res.json();
      
      if (data.message) {
        setMessages(prev => {
          const copy = new Map(prev);
          const convMessages = copy.get(conversationId) || [];
          // Avoid duplicates
          if (!convMessages.find(m => m.id === data.message.id)) {
            copy.set(conversationId, [...convMessages, data.message]);
          }
          return copy;
        });
        return data.message;
      }
      return null;
    } catch (error) {
      console.error("Failed to send message:", error);
      return null;
    }
  }, []);

  const markAsRead = useCallback((conversationId: string) => {
    setMessages(prev => {
      const copy = new Map(prev);
      const convMessages = copy.get(conversationId) || [];
      copy.set(conversationId, convMessages.map(m => ({ ...m, read: true })));
      return copy;
    });
  }, []);

  return (
    <ChatContext.Provider value={{ isConnected, sendMessage, messages, loadMessages, markAsRead }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
}
