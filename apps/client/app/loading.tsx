// Top-level loading UI for the entire app.
// Shown by Next.js during server-component data fetches.

export default function Loading() {
  return (
    <div className="min-h-screen bg-peak-cream flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3 animate-pulse" aria-hidden>
          ⛰️
        </div>
        <p className="font-mono uppercase tracking-[0.25em] text-xs text-peak-slate">
          Warming up the lodge…
        </p>
      </div>
    </div>
  );
}
