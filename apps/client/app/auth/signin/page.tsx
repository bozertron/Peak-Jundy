"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await signIn("email", {
        email,
        callbackUrl,
        redirect: false,
      });

      if (res?.error) {
        setError(
          res.error === "EmailSignin"
            ? "Couldn't send the link. Check the email address and try again."
            : res.error
        );
      } else {
        setSent(true);
      }
    } catch (err) {
      console.error("[signin]", err);
      setError("Network hiccup — try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-peak-cream flex items-center justify-center px-4 py-12">
      <div className="peak-frame bg-white rounded-peak p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4 text-3xl" aria-label="Peak">
            ⛰️
          </Link>
          <p className="font-mono uppercase tracking-[0.25em] text-xs text-peak-slate mb-2">
            Sign in to Peak
          </p>
          <h1 className="font-serif text-2xl font-bold text-peak-charcoal">
            We&rsquo;ll send a magic link.
          </h1>
          <p className="text-peak-charcoal/60 text-sm mt-2">
            No passwords. Click the link in your inbox and you&rsquo;re in.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="rounded-peak bg-peak-forest/5 border border-peak-forest/20 p-5 text-center">
              <div className="text-3xl mb-2" aria-hidden>📬</div>
              <p className="font-serif text-lg text-peak-charcoal mb-1">
                Check your inbox.
              </p>
              <p className="text-sm text-peak-charcoal/70">
                We sent a sign-in link to{" "}
                <span className="font-medium">{email}</span>. It expires in 24 hours.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              className="w-full text-sm text-peak-charcoal/60 hover:text-peak-charcoal transition-colors"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-peak-charcoal mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourdomain.com"
                className="w-full px-4 py-2.5 rounded-peak bg-peak-snow border border-peak-stone text-peak-charcoal placeholder:text-peak-slate focus:outline-none focus:ring-2 focus:ring-peak-forest-500 focus:ring-offset-1 transition-all"
              />
            </div>

            {error && (
              <div
                className="rounded-peak bg-peak-burgundy/5 border border-peak-burgundy/30 text-peak-burgundy p-3 text-sm"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-peak-charcoal/50">
          By signing in, you agree to be kind on the trail. Nothing legalese.
        </p>
      </div>
    </div>
  );
}
