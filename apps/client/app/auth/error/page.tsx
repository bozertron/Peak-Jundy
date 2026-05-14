"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  const params = useSearchParams();
  const error = params.get("error");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Authentication error</h1>
        <p className="text-gray-600 mb-6">
          {error ? `Error: ${error}` : "Something went wrong."}
        </p>
        <div className="flex gap-3">
          <Link className="btn-secondary" href="/auth/signin">
            Try again
          </Link>
          <Link className="btn-secondary" href="/">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
