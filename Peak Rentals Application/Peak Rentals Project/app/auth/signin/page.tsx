"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await signIn("email", {
      email,
      callbackUrl,
      redirect: false,
    });

    if (res?.error) {
      setError(res.error);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Sign in</h1>
        <p className="text-gray-600 mb-6">Get a magic link via email.</p>

        {sent ? (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 text-sm">
            Check your inbox for a sign-in link.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                className="input-field w-full"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <button className="btn-primary w-full" type="submit">
              Send magic link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
