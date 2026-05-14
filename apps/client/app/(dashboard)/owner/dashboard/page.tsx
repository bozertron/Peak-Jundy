import PaymentStatus from "@/components/Stripe/PaymentStatus";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function OwnerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");
  const userId = session.user.id;
  const isOwner = session.user.role === "OWNER" || session.user.role === "ADMIN";

  if (!isOwner) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <h1 className="text-2xl font-bold">Owner Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Complete Stripe onboarding to unlock owner tools.
          </p>
          <div className="mt-4">
            <Link className="btn-primary" href="/owner/onboarding">
              Start Stripe Onboarding
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [equipmentCount, bookingCount, revenue, recentBookings] = await Promise.all([
    prisma.equipment.count({ where: { ownerId: userId } }),
    prisma.booking.count({ where: { equipment: { ownerId: userId } } }),
    prisma.booking.aggregate({
      where: { equipment: { ownerId: userId }, status: "CONFIRMED" },
      _sum: { totalPrice: true },
    }),
    prisma.booking.findMany({
      where: { equipment: { ownerId: userId } },
      include: { equipment: true, renter: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white border rounded-lg p-6">
        <div>
          <h1 className="text-2xl font-bold">Owner Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Payout status + listing performance.</p>
        </div>
        <Link className="btn-primary" href="/owner/create-listing">Create Listing</Link>
      </div>

      <PaymentStatus />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="text-sm text-gray-600">Listings</div>
          <div className="text-3xl font-bold">{equipmentCount}</div>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <div className="text-sm text-gray-600">Bookings</div>
          <div className="text-3xl font-bold">{bookingCount}</div>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <div className="text-sm text-gray-600">Revenue (confirmed)</div>
          <div className="text-3xl font-bold">{formatCurrency(revenue._sum.totalPrice ?? 0)}</div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2">Next steps</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Complete Stripe onboarding if payouts are not enabled.</li>
          <li>Keep listings up to date with accurate specs and pricing.</li>
          <li>Review unfulfilled searches (admin) to spot demand.</li>
        </ul>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Recent Bookings</h2>
          <p className="text-sm text-gray-600">Latest rentals for your equipment.</p>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Renter</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {recentBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-sm text-gray-900">{booking.equipment.title}</td>
                <td className="px-6 py-3 text-sm text-gray-700">
                  {booking.renter.email ?? "Unknown"}
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">
                  {booking.startDate.toDateString()} to {booking.endDate.toDateString()}
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">
                  {formatCurrency(booking.totalPrice)}
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">{booking.status}</td>
              </tr>
            ))}
            {!recentBookings.length && (
              <tr>
                <td className="px-6 py-6 text-sm text-gray-600" colSpan={5}>
                  No bookings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
