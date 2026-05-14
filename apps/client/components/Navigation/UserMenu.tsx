"use client";

import Link from "next/link";
import type { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";

export default function UserMenu({ session }: { session: Session | null }) {
  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <button
          className="btn-secondary"
          onClick={() => signIn(undefined, { callbackUrl: "/dashboard" })}
        >
          Sign in
        </button>
      </div>
    );
  }

  const role = session.user.role;

  return (
    <div className="flex items-center gap-3">
      <span className="hidden sm:inline text-sm text-gray-600">
        {session.user.email ?? session.user.name ?? "Signed in"}
      </span>
      <span className="hidden md:inline text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
        {role}
      </span>

      <Link className="btn-secondary" href="/dashboard">
        Dashboard
      </Link>
      <button className="btn-secondary" onClick={() => signOut({ callbackUrl: "/" })}>
        Sign out
      </button>
    </div>
  );
}
