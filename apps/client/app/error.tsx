"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to whatever observability we have. (For v0, console + browser devtools.)
    console.error("[peak] unhandled error", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-peak-cream flex items-center justify-center p-6">
      <div className="peak-frame bg-white rounded-peak p-10 max-w-lg text-center">
        <div className="text-7xl mb-5" aria-hidden>
          🌨️
        </div>
        <p className="font-mono uppercase tracking-[0.25em] text-xs text-peak-slate mb-2">
          A storm rolled in
        </p>
        <h1 className="font-serif text-3xl font-bold text-peak-charcoal mb-3">
          Something didn&rsquo;t go to plan.
        </h1>
        <p className="text-peak-charcoal/70 mb-6 leading-relaxed">
          We&rsquo;ve logged the details. Try again — if it keeps happening, send
          us the page URL and what you were doing.
        </p>
        {error.digest && (
          <p className="font-mono text-[11px] text-peak-charcoal/40 mb-6">
            ref: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-peak border border-peak-charcoal/15 text-peak-charcoal hover:bg-peak-cream transition-colors"
          >
            Back to Peak
          </Link>
        </div>
      </div>
    </div>
  );
}
