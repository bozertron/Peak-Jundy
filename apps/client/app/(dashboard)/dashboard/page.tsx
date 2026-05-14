import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { authOptions } from "@/lib/auth";

export default async function DashboardHome() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "USER";

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Signed in as <b>{session?.user?.email}</b> ({role})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/browse" className="card p-6">
          <div className="font-semibold">Browse equipment</div>
          <div className="text-sm text-gray-600 mt-1">Find what you need.</div>
        </Link>

        <Link href="/dashboard/rentals" className="card p-6">
          <div className="font-semibold">My rentals</div>
          <div className="text-sm text-gray-600 mt-1">View bookings and status.</div>
        </Link>

        <Link href="/dashboard/profile" className="card p-6">
          <div className="font-semibold">Profile</div>
          <div className="text-sm text-gray-600 mt-1">Account info and role.</div>
        </Link>
      </div>
    </div>
  );
}
