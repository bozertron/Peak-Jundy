"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Props {
  ownerId: string;
  ownerName: string;
  equipmentId: string;
  equipmentTitle: string;
}

export function MessageOwnerButton({
  ownerId,
  ownerName,
  equipmentId,
  equipmentTitle,
}: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session || session.user?.id === ownerId) {
    return null;
  }

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: ownerId,
          equipmentId,
          initialMessage: `Hey ${ownerName.split(" ")[0] ?? ""} — interested in the ${equipmentTitle}.`,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 403) {
          setError(
            `You're not in ${ownerName}'s network yet. Get a vouch from someone they trust and try again.`
          );
        } else {
          setError(data?.error || "Couldn't start a conversation. Try again.");
        }
        return;
      }

      router.push(`/chat/${data.conversation.id}`);
    } catch (e) {
      console.error("[start-conversation]", e);
      setError("Network hiccup — couldn't start a conversation. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full py-3 px-4 rounded-peak bg-peak-burgundy text-white font-medium
                   hover:bg-peak-burgundy/90 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <span>Opening a conversation…</span>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Message {ownerName}
          </>
        )}
      </button>
      {error && (
        <p className="text-sm text-peak-burgundy/80 text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
