"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

const ERROR_COPY: Record<string, { title: string; body: string }> = {
  Verification: {
    title: "That link is no good anymore.",
    body: "Magic links expire after a while or after one use. Ask for a fresh one.",
  },
  AccessDenied: {
    title: "Access denied.",
    body: "Your account isn't permitted on Peak. If you think that's wrong, get in touch.",
  },
  Configuration: {
    title: "Sign-in isn't configured.",
    body: "The email provider isn't wired up on this Peak instance. Check the server env vars.",
  },
  default: {
    title: "Sign-in didn't work.",
    body: "Something tripped on the way in. Give it another go.",
  },
};

export default function AuthErrorPage() {
  const params = useSearchParams();
  const errorKey = params.get("error") ?? "default";
  const copy = ERROR_COPY[errorKey] ?? ERROR_COPY.default!;

  return (
    <div className="min-h-screen bg-peak-cream flex items-center justify-center px-4 py-12">
      <div className="peak-frame bg-white rounded-peak p-8 w-full max-w-md text-center">
        <div className="text-5xl mb-4" aria-hidden>
          🌨️
        </div>
        <p className="font-mono uppercase tracking-[0.25em] text-xs text-peak-slate mb-2">
          Sign-in
        </p>
        <h1 className="font-serif text-2xl font-bold text-peak-charcoal mb-3">
          {copy.title}
        </h1>
        <p className="text-peak-charcoal/70 mb-6">{copy.body}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth/signin"
            className="px-5 py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 transition-colors"
          >
            Try again
          </Link>
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
