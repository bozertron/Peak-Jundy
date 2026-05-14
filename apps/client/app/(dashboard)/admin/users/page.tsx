import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { equipment: true, rentals: true } },
    },
  });

  return (
    <div className="max-w-6xl space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-sm text-gray-600 mt-1">
          Review users, roles, and activity levels.
        </p>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listings</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rentals</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-sm text-gray-900">
                  <div className="font-medium">{user.name ?? "Unnamed"}</div>
                  <div className="text-xs text-gray-500">{user.email ?? "No email"}</div>
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">{user.role}</td>
                <td className="px-6 py-3 text-sm text-gray-700">{user._count.equipment}</td>
                <td className="px-6 py-3 text-sm text-gray-700">{user._count.rentals}</td>
                <td className="px-6 py-3 text-sm text-gray-700">
                  {user.createdAt.toDateString()}
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr>
                <td className="px-6 py-6 text-sm text-gray-600" colSpan={5}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
