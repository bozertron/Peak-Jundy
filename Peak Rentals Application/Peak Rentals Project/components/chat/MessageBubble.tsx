interface MessageBubbleProps {
  content: string;
  isMine: boolean;
  timestamp: number | string;
  delivered?: boolean;
}

export function MessageBubble({ content, isMine, timestamp, delivered }: MessageBubbleProps) {
  const time = typeof timestamp === "number" 
    ? new Date(timestamp) 
    : new Date(timestamp);
  
  const formattedTime = time.toLocaleTimeString([], { 
    hour: "numeric", 
    minute: "2-digit" 
  });

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isMine
            ? "bg-peak-forest text-white rounded-br-sm"
            : "bg-white border border-peak-wood/10 text-peak-charcoal rounded-bl-sm"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
          <span className={`text-xs ${isMine ? "text-white/60" : "text-peak-charcoal/40"}`}>
            {formattedTime}
          </span>
          {isMine && delivered && (
            <svg className="w-3 h-3 text-white/60" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
