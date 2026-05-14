import Link from "next/link";
import type { Session } from "next-auth";
import UserMenu from "@/components/Navigation/UserMenu";

export default function Navbar({ session }: { session: Session | null }) {
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-peak-charcoal/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-7">
          <Link
            href="/"
            className="font-serif text-2xl font-bold text-peak-charcoal tracking-tight"
          >
            Peak
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm text-peak-charcoal/70">
            <Link className="hover:text-peak-charcoal transition-colors" href="/browse">
              Browse
            </Link>
            <Link className="hover:text-peak-charcoal transition-colors" href="/map">
              Map
            </Link>
            {session && (
              <>
                <Link className="hover:text-peak-charcoal transition-colors" href="/network">
                  Network
                </Link>
                <Link className="hover:text-peak-charcoal transition-colors" href="/cards">
                  Cards
                </Link>
                <Link className="hover:text-peak-charcoal transition-colors" href="/peaks">
                  Peaks
                </Link>
                <Link className="hover:text-peak-charcoal transition-colors" href="/dashboard">
                  Dashboard
                </Link>
              </>
            )}
          </nav>
        </div>

        <UserMenu session={session} />
      </div>
    </header>
  );
}
