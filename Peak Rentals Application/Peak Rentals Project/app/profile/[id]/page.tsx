import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Props {
  params: { id: string };
}

export default async function ProfilePage({ params }: Props) {
  const session = await getServerSession(authOptions);
  
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      bio: true,
      flavor: true,
      locationName: true,
      memberSince: true,
      foundingMember: true,
      peaksBalance: true,
      equipment: {
        where: { available: true },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          dailyRate: true,
          image: true,
        },
        take: 6,
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          equipment: true,
          vouchesGiven: true,
          vouchesReceived: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Check if current user has this person in their network
  let isInNetwork = false;
  if (session?.user?.id && session.user.id !== user.id) {
    const connection = await prisma.contactCard.findFirst({
      where: {
        collectorId: session.user.id,
        subjectId: user.id,
      },
    });
    isInNetwork = !!connection;
  }

  const isOwnProfile = session?.user?.id === user.id;

  return (
    <div className="min-h-screen bg-peak-cream">
      {/* Header */}
      <header className="bg-white border-b border-peak-charcoal/10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">⛰️</span>
              <h1 className="font-serif text-xl font-bold text-peak-charcoal">Peak</h1>
            </Link>
          </div>

          <nav className="flex items-center gap-4">
            <Link href="/map" className="text-sm text-peak-charcoal/70 hover:text-peak-charcoal transition-colors">
              Map
            </Link>
            <Link href="/cards" className="text-sm text-peak-charcoal/70 hover:text-peak-charcoal transition-colors">
              Cards
            </Link>
            <Link href="/network" className="text-sm text-peak-charcoal/70 hover:text-peak-charcoal transition-colors">
              Network
            </Link>
          </nav>
        </div>
      </header>

      {/* Profile Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <div className="peak-frame overflow-hidden mb-8">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-br from-peak-forest to-peak-forest/80 relative">
            <div className="absolute inset-0 opacity-10">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <pattern id="peaks" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M0 20 L10 5 L20 20 Z" fill="white" />
                </pattern>
                <rect width="100" height="100" fill="url(#peaks)" />
              </svg>
            </div>
            
            {/* Founding member badge */}
            {user.foundingMember && (
              <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 text-peak-charcoal text-sm font-medium rounded-full shadow-sm">
                ⛰️ Founding Member
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-12 mb-4">
              <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg inline-block">
                <div className="w-full h-full rounded-full bg-peak-cream flex items-center justify-center overflow-hidden">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.name || "Profile"}
                      width={88}
                      height={88}
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-4xl">👤</span>
                  )}
                </div>
              </div>
            </div>

            {/* Name & Details */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="font-serif text-2xl font-bold text-peak-charcoal">
                  {user.name || "Anonymous"}
                </h1>
                
                {user.flavor && (
                  <p className="text-peak-forest italic mt-1">&ldquo;{user.flavor}&rdquo;</p>
                )}
                
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-peak-charcoal/60">
                  {user.locationName && (
                    <span className="flex items-center gap-1">
                      📍 {user.locationName}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    📅 Member since {new Date(user.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {!isOwnProfile && session && (
                <div className="flex gap-2">
                  {isInNetwork ? (
                    <Link
                      href={`/cards`}
                      className="px-4 py-2 bg-peak-forest text-white font-medium rounded-peak hover:bg-peak-forest/90 transition-colors text-sm"
                    >
                      💬 Message
                    </Link>
                  ) : (
                    <span className="px-4 py-2 bg-peak-charcoal/10 text-peak-charcoal/60 font-medium rounded-peak text-sm">
                      Not in your network
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="mt-4 text-peak-charcoal">{user.bio}</p>
            )}

            {/* Stats Row */}
            <div className="flex gap-6 mt-6 pt-4 border-t border-peak-charcoal/10">
              <div className="text-center">
                <div className="text-xl font-bold text-peak-charcoal">{user._count.equipment}</div>
                <div className="text-xs text-peak-charcoal/60">Listings</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-peak-charcoal">{user._count.vouchesReceived}</div>
                <div className="text-xs text-peak-charcoal/60">Vouches Received</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-peak-charcoal">{user._count.vouchesGiven}</div>
                <div className="text-xs text-peak-charcoal/60">Vouches Given</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-peak-forest">{user.peaksBalance}</div>
                <div className="text-xs text-peak-charcoal/60">Peaks ⛰️</div>
              </div>
            </div>
          </div>
        </div>

        {/* Equipment Section */}
        {user.equipment.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold text-peak-charcoal mb-4">
              Available Equipment
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.equipment.map((item) => (
                <Link key={item.id} href={`/equipment/${item.id}`} className="peak-frame overflow-hidden peak-hover-lift">
                  {/* Image */}
                  {item.image && (
                    <div className="aspect-[4/3] relative">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-4">
                    <span className="text-xs font-medium text-peak-forest uppercase tracking-wide">
                      {item.category}
                    </span>
                    <h3 className="font-serif font-bold text-peak-charcoal mt-1 line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-peak-charcoal/60 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-lg font-bold text-peak-forest">
                        ${(item.dailyRate / 100).toFixed(0)}
                      </span>
                      <span className="text-xs text-peak-charcoal/50">/day</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {user._count.equipment > 6 && (
              <div className="text-center mt-6">
                <Link
                  href={`/browse?owner=${user.id}`}
                  className="text-peak-forest hover:underline font-medium"
                >
                  View all {user._count.equipment} listings →
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Empty state for equipment */}
        {user.equipment.length === 0 && (
          <div className="peak-frame p-8 text-center">
            <div className="text-4xl mb-3">🎿</div>
            <h3 className="font-serif text-lg font-bold text-peak-charcoal mb-2">
              No Equipment Listed
            </h3>
            <p className="text-sm text-peak-charcoal/60">
              {isOwnProfile 
                ? "You haven't listed any equipment yet."
                : "This user hasn't listed any equipment yet."
              }
            </p>
            {isOwnProfile && (
              <Link
                href="/equipment/new"
                className="inline-block mt-4 px-4 py-2 bg-peak-forest text-white font-medium rounded-peak hover:bg-peak-forest/90 transition-colors"
              >
                List Your First Item
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
