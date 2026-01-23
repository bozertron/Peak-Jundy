import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function RentalsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");
  const renterId = session.user.id;

  const bookings = await prisma.booking.findMany({
    where: { renterId },
    orderBy: { createdAt: "desc" },
    include: { equipment: true },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h1 className="text-2xl font-bold">My Rentals</h1>
        <p className="text-sm text-gray-600 mt-1">
          Your bookings and payment status.
        </p>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-sm">
                  <Link className="text-blue-600 hover:underline" href={`/equipment/${b.equipmentId}`}>
                    {b.equipment.title}
                  </Link>
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">
                  {b.startDate.toDateString()} → {b.endDate.toDateString()}
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">{formatCurrency(b.totalPrice)}</td>
                <td className="px-6 py-3 text-sm">
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">{b.status}</span>
                </td>
              </tr>
            ))}
            {!bookings.length && (
              <tr>
                <td className="px-6 py-6 text-sm text-gray-600" colSpan={4}>
                  No rentals yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
