"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

function NavItem({
  href,
  label,
  exact = false,
}: {
  href: string;
  label: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-peak text-sm transition-colors ${
        active
          ? "bg-peak-forest text-white font-medium shadow-peak-sm"
          : "text-peak-charcoal/70 hover:bg-peak-cream hover:text-peak-charcoal"
      }`}
    >
      {label}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 mb-2 px-3 font-mono uppercase tracking-[0.2em] text-[10px] text-peak-slate">
      {children}
    </p>
  );
}

export default function Sidebar({ userRole }: { userRole: string }) {
  const isOwner = userRole === "OWNER" || userRole === "ADMIN";
  const isAdmin = userRole === "ADMIN";

  return (
    <aside className="w-64 border-r border-peak-charcoal/10 bg-peak-snow p-4 flex flex-col">
      <SectionLabel>You</SectionLabel>
      <div className="space-y-1">
        <NavItem href="/dashboard" label="Overview" exact />
        <NavItem href="/dashboard/rentals" label="My rentals" />
        <NavItem href="/dashboard/profile" label="Profile" />
      </div>

      <SectionLabel>Discover</SectionLabel>
      <div className="space-y-1">
        <NavItem href="/browse" label="Browse" />
        <NavItem href="/map" label="Map" />
        <NavItem href="/network" label="Trust network" />
        <NavItem href="/cards" label="Contact cards" />
        <NavItem href="/peaks" label="Peaks · treasure" />
      </div>

      {isOwner && (
        <>
          <SectionLabel>Owner</SectionLabel>
          <div className="space-y-1">
            <NavItem href="/owner/dashboard" label="Owner dashboard" exact />
            <NavItem href="/dashboard/listings" label="My listings" />
            <NavItem href="/owner/create-listing" label="New listing" />
            <NavItem href="/owner/onboarding" label="Stripe onboarding" />
          </div>
        </>
      )}

      {isAdmin && (
        <>
          <SectionLabel>Admin</SectionLabel>
          <div className="space-y-1">
            <NavItem href="/admin/dashboard" label="Admin overview" exact />
            <NavItem
              href="/admin/dashboard/unfulfilled"
              label="Unfulfilled searches"
            />
            <NavItem href="/admin/users" label="Users" />
            <NavItem href="/admin/settings" label="Platform settings" />
          </div>
        </>
      )}

      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full px-3 py-2 rounded-peak border border-peak-charcoal/15 text-sm text-peak-charcoal/70 hover:bg-peak-cream hover:text-peak-charcoal transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
