"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { ChatWindow } from "@/components/chat/ChatWindow";

interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    name: string | null;
    avatarUrl: string | null;
  }>;
  equipment?: {
    id: string;
    title: string;
  } | null;
}

function ChatPageContent() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const conversationId = params.conversationId as string;

  useEffect(() => {
    const fetchConversation = async () => {
      if (status !== "authenticated" || !conversationId) return;

      try {
        // Fetch conversation details
        const res = await fetch("/api/conversations");
        if (!res.ok) throw new Error("Failed to fetch conversations");
        
        const data = await res.json();
        const conv = data.conversations?.find((c: Conversation) => c.id === conversationId);
        
        if (!conv) {
          setError("Conversation not found");
          return;
        }

        setConversation(conv);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load conversation");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversation();
  }, [conversationId, status]);

  // Not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-peak-cream flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-5xl mb-4">💬</div>
          <h1 className="font-serif text-3xl font-bold text-peak-charcoal mb-4">
            Peak Chat
          </h1>
          <p className="text-peak-charcoal/70 mb-6">
            Sign in to access your conversations.
          </p>
          <Link
            href="/auth/signin"
            className="inline-block px-6 py-3 bg-peak-forest text-white font-medium rounded-peak hover:bg-peak-forest/90 transition-colors shadow-peak"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Loading
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-peak-cream flex items-center justify-center">
        <div className="text-peak-charcoal font-medium">Loading conversation...</div>
      </div>
    );
  }

  // Error state
  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-peak-cream flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="font-serif text-2xl font-bold text-peak-charcoal mb-4">
            {error || "Conversation not found"}
          </h1>
          <Link
            href="/cards"
            className="inline-block px-6 py-3 bg-peak-forest text-white font-medium rounded-peak hover:bg-peak-forest/90 transition-colors"
          >
            Back to Cards
          </Link>
        </div>
      </div>
    );
  }

  // Get the other participant (not current user)
  const otherParticipant = conversation.participants.find(p => p.id !== session?.user?.id);

  if (!otherParticipant) {
    return (
      <div className="min-h-screen bg-peak-cream flex items-center justify-center">
        <div className="text-peak-charcoal">Invalid conversation</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-peak-cream">
      {/* Header */}
      <header className="bg-white border-b border-peak-charcoal/10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-peak-charcoal/60 hover:text-peak-charcoal transition-colors"
          >
            ← Back
          </button>
          
          <div className="flex items-center gap-3 flex-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">⛰️</span>
              <span className="font-serif text-lg font-bold text-peak-charcoal hidden sm:inline">Peak</span>
            </Link>
          </div>

          <nav className="flex items-center gap-4">
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
          </nav>
        </div>
      </header>

      {/* Equipment context banner */}
      {conversation.equipment && (
        <div className="bg-peak-forest/5 border-b border-peak-forest/10 px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm">
            <span className="text-peak-charcoal/60">Re:</span>
            <Link 
              href={`/equipment/${conversation.equipment.id}`}
              className="text-peak-forest hover:underline font-medium"
            >
              {conversation.equipment.title}
            </Link>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto p-4">
          <ChatWindow
            conversationId={conversationId}
            participantId={otherParticipant.id}
            participantName={otherParticipant.name || "Unknown"}
            participantAvatar={otherParticipant.avatarUrl || undefined}
          />
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatPageContent />
    </ChatProvider>
  );
}
