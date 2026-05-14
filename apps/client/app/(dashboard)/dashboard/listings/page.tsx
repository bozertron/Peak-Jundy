import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function ListingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");
  const userId = session.user.id;
  const isOwner = session.user.role === "OWNER" || session.user.role === "ADMIN";

  if (!isOwner) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <h1 className="text-2xl font-bold">My Listings</h1>
          <p className="text-sm text-gray-600 mt-2">
            Owner tools are available after Stripe onboarding.
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

  const items = await prisma.equipment.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white border rounded-lg p-6">
        <div>
          <h1 className="text-2xl font-bold">My Listings</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your equipment listings.</p>
        </div>
        <Link className="btn-primary" href="/owner/create-listing">Create Listing</Link>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-sm text-gray-900">{e.title}</td>
                <td className="px-6 py-3 text-sm text-gray-700">{e.category}</td>
                <td className="px-6 py-3 text-sm text-gray-700">{formatCurrency(e.dailyRate)}</td>
                <td className="px-6 py-3 text-sm text-gray-700">{e.available ? "Yes" : "No"}</td>
                <td className="px-6 py-3 text-sm">
                  <Link className="text-blue-600 hover:underline" href={`/owner/listings/${e.id}/edit`}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td className="px-6 py-6 text-sm text-gray-600" colSpan={5}>
                  No listings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
