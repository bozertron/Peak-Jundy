import PaymentStatus from "@/components/Stripe/PaymentStatus";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  PENDING: { label: "Pending", bg: "bg-peak-brass/15", color: "text-peak-brass" },
  CONFIRMED: { label: "Confirmed", bg: "bg-peak-forest/15", color: "text-peak-forest" },
  COMPLETED: { label: "Completed", bg: "bg-peak-navy/15", color: "text-peak-navy" },
  CANCELLED: { label: "Cancelled", bg: "bg-peak-burgundy/15", color: "text-peak-burgundy" },
};

function fmt(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function OwnerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");
  const userId = session.user.id;
  const isOwner =
    session.user.role === "OWNER" || session.user.role === "ADMIN";

  if (!isOwner) {
    return (
      <div className="peak-frame bg-white rounded-peak p-6">
        <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
          Owner dashboard
        </p>
        <h1 className="font-serif text-2xl font-bold text-peak-charcoal mb-3">
          Get set up to get paid.
        </h1>
        <p className="text-peak-charcoal/70 mb-5">
          Owner tools unlock once you&rsquo;ve completed Stripe Connect onboarding.
        </p>
        <Link
          href="/owner/onboarding"
          className="inline-block px-5 py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 transition-colors"
        >
          Start onboarding
        </Link>
      </div>
    );
  }

  const [equipmentCount, bookingCount, revenue, activeRentals, recentBookings] =
    await Promise.all([
      prisma.equipment.count({ where: { ownerId: userId } }),
      prisma.booking.count({ where: { equipment: { ownerId: userId } } }),
      prisma.booking.aggregate({
        where: { equipment: { ownerId: userId }, status: "CONFIRMED" },
        _sum: { totalPrice: true },
      }),
      prisma.booking.count({
        where: {
          equipment: { ownerId: userId },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      }),
      prisma.booking.findMany({
        where: { equipment: { ownerId: userId } },
        include: {
          equipment: { select: { id: true, title: true } },
          renter: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  const revenueCents = revenue._sum.totalPrice ?? 0;

  return (
    <div className="space-y-6">
      <div className="peak-frame bg-white rounded-peak p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
            Owner dashboard
          </p>
          <h1 className="font-serif text-2xl font-bold text-peak-charcoal">
            How the shop&rsquo;s doing
          </h1>
        </div>
        <Link
          href="/owner/create-listing"
          className="px-5 py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 transition-colors"
        >
          + New listing
        </Link>
      </div>

      <PaymentStatus />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Listings" value={String(equipmentCount)} />
        <Stat label="Active rentals" value={String(activeRentals)} />
        <Stat label="All-time bookings" value={String(bookingCount)} />
        <Stat
          label="Confirmed revenue"
          value={formatCurrency(revenueCents)}
          accent
        />
      </div>

      <div className="peak-frame bg-white rounded-peak overflow-hidden">
        <div className="px-5 py-4 border-b border-peak-charcoal/10">
          <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-1">
            Recent activity
          </p>
          <h2 className="font-serif text-lg font-bold text-peak-charcoal">
            Latest rentals on your gear
          </h2>
        </div>
        {recentBookings.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3" aria-hidden>
              🪧
            </div>
            <p className="text-peak-charcoal/70 text-sm">
              Nothing rented out yet. The catalog is live — give it time.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-peak-charcoal/10">
            {recentBookings.map((b) => {
              const status = STATUS_STYLES[b.status] ?? STATUS_STYLES.PENDING!;
              return (
                <li key={b.id} className="p-4 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[220px]">
                    <Link
                      href={`/equipment/${b.equipmentId}`}
                      className="font-medium text-peak-charcoal hover:text-peak-forest transition-colors"
                    >
                      {b.equipment.title}
                    </Link>
                    <p className="text-xs text-peak-charcoal/60 mt-0.5">
                      by {b.renter.name ?? b.renter.email ?? "a renter"} ·{" "}
                      {fmt(b.startDate)} → {fmt(b.endDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-peak-charcoal">
                      {formatCurrency(b.totalPrice)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}
                  >
                    {status.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="peak-frame bg-white rounded-peak p-4">
      <p className="font-mono uppercase tracking-[0.15em] text-[10px] text-peak-slate mb-2">
        {label}
      </p>
      <p
        className={`font-serif text-2xl font-bold ${
          accent ? "text-peak-forest" : "text-peak-charcoal"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
