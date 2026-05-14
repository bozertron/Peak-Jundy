import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  PENDING: {
    label: "Pending",
    bg: "bg-peak-brass/15",
    color: "text-peak-brass",
  },
  CONFIRMED: {
    label: "Confirmed",
    bg: "bg-peak-forest/15",
    color: "text-peak-forest",
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-peak-navy/15",
    color: "text-peak-navy",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-peak-burgundy/15",
    color: "text-peak-burgundy",
  },
};

function fmt(d: Date) {
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function RentalsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const bookings = await prisma.booking.findMany({
    where: { renterId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { equipment: { select: { id: true, title: true, image: true, category: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="peak-frame bg-white rounded-peak p-6">
        <p className="font-mono uppercase tracking-[0.2em] text-xs text-peak-slate mb-2">
          My rentals
        </p>
        <h1 className="font-serif text-2xl font-bold text-peak-charcoal">
          What you&rsquo;ve got out
        </h1>
      </div>

      {bookings.length === 0 ? (
        <div className="peak-frame bg-white rounded-peak p-10 text-center">
          <div className="text-5xl mb-4" aria-hidden>
            🪧
          </div>
          <h2 className="font-serif text-xl font-bold text-peak-charcoal mb-2">
            Nothing rented yet.
          </h2>
          <p className="text-peak-charcoal/70 mb-5">
            Find something on the catalog or the map and put it to work.
          </p>
          <Link
            href="/browse"
            className="inline-block px-5 py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 transition-colors"
          >
            Browse equipment
          </Link>
        </div>
      ) : (
        <div className="peak-frame bg-white rounded-peak overflow-hidden">
          <ul className="divide-y divide-peak-charcoal/10">
            {bookings.map((b) => {
              const status = STATUS_STYLES[b.status] ?? STATUS_STYLES.PENDING!;
              return (
                <li key={b.id} className="p-5 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <Link
                      href={`/equipment/${b.equipmentId}`}
                      className="font-serif text-lg font-bold text-peak-charcoal hover:text-peak-forest transition-colors"
                    >
                      {b.equipment.title}
                    </Link>
                    <p className="font-mono uppercase tracking-[0.15em] text-[10px] text-peak-slate mt-1">
                      {b.equipment.category}
                    </p>
                    <p className="text-sm text-peak-charcoal/70 mt-1">
                      {fmt(b.startDate)} → {fmt(b.endDate)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-serif text-xl font-bold text-peak-forest">
                      {formatCurrency(b.totalPrice)}
                    </p>
                    {b.cancellationReason && (
                      <p className="text-xs text-peak-burgundy/70 mt-1">
                        Cancelled: {b.cancellationReason.replace(/_/g, " ")}
                      </p>
                    )}
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
        </div>
      )}
    </div>
  );
}
