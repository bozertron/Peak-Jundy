"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-lg text-sm ${
        active ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Sidebar({ userRole }: { userRole: string }) {
  const isOwner = userRole === "OWNER" || userRole === "ADMIN";
  const isAdmin = userRole === "ADMIN";

  return (
    <aside className="w-64 border-r bg-white p-4 flex flex-col">
      <div className="font-extrabold text-gray-900 mb-6">Peak Rentals</div>

      <div className="space-y-1">
        <NavItem href="/dashboard" label="Dashboard" />
        <NavItem href="/browse" label="Browse" />
        <NavItem href="/dashboard/rentals" label="My Rentals" />
        <NavItem href="/dashboard/profile" label="Profile" />
      </div>

      {isOwner && (
        <>
          <div className="mt-6 mb-2 text-xs font-semibold text-gray-500 uppercase">
            Owner
          </div>
          <div className="space-y-1">
            <NavItem href="/owner/dashboard" label="Owner Dashboard" />
            <NavItem href="/owner/create-listing" label="Create Listing" />
            <NavItem href="/dashboard/listings" label="My Listings" />
            <NavItem href="/owner/onboarding" label="Stripe Onboarding" />
          </div>
        </>
      )}

      {isAdmin && (
        <>
          <div className="mt-6 mb-2 text-xs font-semibold text-gray-500 uppercase">
            Admin
          </div>
          <div className="space-y-1">
            <NavItem href="/admin/dashboard" label="Admin Dashboard" />
            <NavItem href="/admin/dashboard/unfulfilled" label="Unfulfilled Searches" />
            <NavItem href="/admin/users" label="User Management" />
            <NavItem href="/admin/settings" label="Platform Settings" />
          </div>
        </>
      )}

      <div className="mt-auto pt-6">
        <button
          className="w-full btn-secondary"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
