import Link from "next/link";
import type { Session } from "next-auth";
import UserMenu from "@/components/Navigation/UserMenu";

export default function Navbar({ session }: { session: Session | null }) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
      <div className="container-lg h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-extrabold text-gray-900">
            Peak
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm text-gray-600">
            <Link className="hover:text-gray-900" href="/browse">
              Browse
            </Link>
            {session && (
              <Link className="hover:text-gray-900" href="/dashboard">
                Dashboard
              </Link>
            )}
          </nav>
        </div>

        <UserMenu session={session} />
      </div>
    </header>
  );
}
