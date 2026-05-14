import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      peaksBalance: true,
      foundingMember: true,
      _count: {
        select: {
          equipment: true,
          rentals: true,
          vouchesGiven: true,
          vouchesReceived: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="peak-frame bg-white rounded-peak p-6">
        <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
          Admin · users
        </p>
        <h1 className="font-serif text-2xl font-bold text-peak-charcoal">
          Who&rsquo;s on Peak
        </h1>
        <p className="text-sm text-peak-charcoal/70 mt-2">
          {users.length} {users.length === 1 ? "person" : "people"} signed up
          so far.
        </p>
      </div>

      <div className="peak-frame bg-white rounded-peak overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-peak-cream/50 border-b border-peak-charcoal/10">
              <tr>
                <Th>User</Th>
                <Th>Role</Th>
                <Th>Peaks</Th>
                <Th>Listings</Th>
                <Th>Rentals</Th>
                <Th>Vouches (out / in)</Th>
                <Th>Joined</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-peak-charcoal/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-peak-cream/30 transition-colors">
                  <td className="px-5 py-3">
                    <Link
                      href={`/profile/${u.id}`}
                      className="font-medium text-peak-charcoal hover:text-peak-forest transition-colors"
                    >
                      {u.name ?? "Unnamed"}
                    </Link>
                    <p className="text-xs text-peak-charcoal/50">
                      {u.email ?? "no email"}
                    </p>
                    {u.foundingMember && (
                      <span className="inline-block mt-1 text-[10px] font-medium bg-peak-brass/15 text-peak-brass px-1.5 py-0.5 rounded-full">
                        ⭐ Founder
                      </span>
                    )}
                  </td>
                  <Td>{u.role}</Td>
                  <Td>{u.peaksBalance}</Td>
                  <Td>{u._count.equipment}</Td>
                  <Td>{u._count.rentals}</Td>
                  <Td>
                    {u._count.vouchesGiven} / {u._count.vouchesReceived}
                  </Td>
                  <Td>{fmtDate(u.createdAt)}</Td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td
                    className="px-5 py-8 text-sm text-peak-charcoal/60 text-center"
                    colSpan={7}
                  >
                    No users yet. Seed the DB or wait for sign-ups.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-3 text-left font-mono uppercase tracking-[0.15em] text-[10px] text-peak-slate">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-5 py-3 text-sm text-peak-charcoal/80 whitespace-nowrap">
      {children}
    </td>
  );
}
