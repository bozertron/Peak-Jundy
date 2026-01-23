# Peak Rentals: Frontend Architecture & Component Specifications

## Project Structure

```
Peak Rentals Project/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── bookings/route.ts
│   │   ├── equipment/
│   │   │   ├── route.ts (GET, POST)
│   │   │   ├── search/route.ts (POST)
│   │   │   └── [id]/route.ts (GET, PUT, DELETE)
│   │   ├── analytics/
│   │   │   ├── market-gaps/route.ts
│   │   │   ├── owner-stats/route.ts
│   │   │   └── unfulfilled-searches/route.ts
│   │   └── stripe/
│   │       ├── account-status/route.ts
│   │       ├── checkout/route.ts
│   │       ├── products/route.ts
│   │       ├── webhook/route.ts
│   │       └── connect/
│   │           ├── route.ts
│   │           ├── account/route.ts
│   │           ├── onboarding-link/route.ts
│   │           └── account-status/route.ts
│   ├── auth/
│   │   ├── signin/page.tsx
│   │   └── error/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── listings/page.tsx
│   │   │   ├── rentals/page.tsx
│   │   │   └── profile/page.tsx
│   │   ├── owner/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── create-listing/page.tsx
│   │   │   ├── onboarding/page.tsx
│   │   │   ├── reauth/page.tsx
│   │   │   ├── edit-listing/[id]/page.tsx (redirect)
│   │   │   └── listings/[id]/edit/page.tsx
│   │   └── admin/
│   │       ├── layout.tsx
│   │       ├── dashboard/page.tsx
│   │       ├── dashboard/unfulfilled/page.tsx
│   │       ├── users/page.tsx
│   │       ├── settings/page.tsx
│   │       └── unfulfilled-searches/page.tsx (redirect)
│   ├── booking/
│   │   ├── success/page.tsx
│   │   └── cancel/page.tsx
│   ├── browse/page.tsx
│   ├── equipment/[id]/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Admin/
│   │   ├── AdminDashboard.tsx
│   │   ├── MarketGaps.tsx
│   │   └── UnfulfilledSearches.tsx
│   ├── Equipment/
│   │   ├── EquipmentCard.tsx
│   │   ├── EquipmentDetail.tsx
│   │   ├── EquipmentForm.tsx
│   │   └── EquipmentGrid.tsx
│   ├── Navigation/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── UserMenu.tsx
│   ├── Search/
│   │   ├── EquipmentSearch.tsx
│   │   └── SearchBar.tsx
│   ├── Stripe/
│   │   ├── CheckoutButton.tsx
│   │   ├── CheckoutFlow.tsx
│   │   ├── OwnerOnboarding.tsx
│   │   ├── PaymentStatus.tsx
│   │   ├── Storefront.tsx
│   │   └── StripeConnectDashboard.tsx
│   ├── Providers.tsx
│   ├── Footer.tsx
│   ├── EquipmentCard.tsx (re-export)
│   ├── EquipmentDetail.tsx (re-export)
│   ├── EquipmentSearch.tsx (re-export)
│   ├── SearchBar.tsx (re-export)
│   ├── CheckoutButton.tsx (re-export)
│   └── AdminDashboard.tsx (re-export)
├── lib/
│   ├── auth.ts
│   ├── categories.ts
│   ├── hooks.ts
│   ├── prisma.ts
│   ├── stripe.ts
│   ├── types.ts
│   ├── utils.ts
│   └── validation.ts
├── types/
│   ├── global.d.ts
│   └── next-auth.d.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   └── images/
├── styles/
│   └── globals.css
├── middleware.ts
├── next.config.js
├── tailwind.config.ts
├── .env.local
├── .gitignore
├── tsconfig.json
└── package.json
```

---

## Layout Structure

### Root Layout
**File: `app/layout.tsx`**
```typescript
import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import Navbar from "@/components/Navigation/Navbar";
import Footer from "@/components/Footer";
import { authOptions } from "@/lib/auth";
import Providers from "@/components/Providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Peak Rentals - Equipment Rental Marketplace",
  description: "Peer-to-peer heavy equipment rental platform",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="bg-gray-50">
        <Providers session={session}>
          <Navbar session={session} />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
```

### Dashboard Layout (Protected)
**File: `app/(dashboard)/layout.tsx`**
```typescript
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Navigation/Sidebar";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const role = session.user.role;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar userRole={role} />
      <div className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
```

### Admin Layout (Role Gate)
**File: `app/(dashboard)/admin/layout.tsx`**
```typescript
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard?error=forbidden");
  }

  return <>{children}</>;
}
```

---

## Core Components

### 1. EquipmentCard Component
**File: `components/Equipment/EquipmentCard.tsx`**
```typescript
"use client";

import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Equipment } from "@/lib/types";

interface EquipmentCardProps {
  equipment: Equipment;
}

export default function EquipmentCard({
  equipment,
}: EquipmentCardProps) {
  const {
    id,
    title,
    category,
    dailyRate,
    owner,
    image,
    available = true,
    location,
  } = equipment;
  return (
    <Link href={`/equipment/${id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer h-full flex flex-col">
        <div className="relative w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300">
          {image ? (
            <Image src={image} alt={title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5m-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11m3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
              </svg>
            </div>
          )}
          {!available && (
            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
              Unavailable
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-2">{category}</p>
          {location && <p className="text-xs text-gray-400 mb-2">Location: {location}</p>}

          <div className="mt-auto flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(dailyRate)}
              </p>
              <p className="text-xs text-gray-500">per day</p>
            </div>
            <p className="text-xs text-gray-500">by {owner.name ?? "Owner"}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

### 2. SearchBar Component
**File: `components/Search/SearchBar.tsx`**
```typescript
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EQUIPMENT_CATEGORIES } from "@/lib/categories";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const suggestions = [
    ...EQUIPMENT_CATEGORIES,
    "Telehandler 10k",
    "Boom lift 60ft",
    "Scissor lift electric",
    "Skid steer tracks",
    "ICF bracing system",
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    const trimmedCategory = category.trim();

    if (!trimmedQuery) {
      setError("Enter a search term.");
      return;
    }

    if (trimmedQuery.length > 100) {
      setError("Search query must be 100 characters or fewer.");
      return;
    }

    const params = new URLSearchParams();
    if (trimmedQuery) params.set("q", trimmedQuery);
    if (trimmedCategory) params.set("category", trimmedCategory);

    setError(null);
    startTransition(() => {
      router.push(`/browse?${params.toString()}`);
    });
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search equipment (telehandler, boom lift...)"
          value={query}
          list="equipment-search-suggestions"
          onChange={(e) => {
            setQuery(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={Boolean(error)}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
        <datalist id="equipment-search-suggestions">
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
        >
          <option value="">All Categories</option>
          <option value="Telehandler">Telehandler</option>
          <option value="Boom Lift">Boom Lift</option>
          <option value="Skid Steer">Skid Steer</option>
          <option value="ICF Bracing">ICF Bracing</option>
        </select>

        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
```

### 3. EquipmentDetail Component
**File: `components/Equipment/EquipmentDetail.tsx`**
```typescript
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, safeJsonParse } from "@/lib/utils";
import CheckoutFlow from "@/components/Stripe/CheckoutFlow";

interface EquipmentDetailProps {
  viewerId?: string | null;
  equipment: {
    id: string;
    ownerId: string;
    title: string;
    description: string;
    category: string;
    specs: string;
    dailyRate: number;
    available: boolean;
    image?: string | null;
    location?: string | null;
    hourMeter?: number | null;
    owner: { name: string | null; email?: string | null; stripeAccountId?: string | null };
  };
}

export default function EquipmentDetail({ equipment, viewerId }: EquipmentDetailProps) {
  const router = useRouter();
  const specs = safeJsonParse<Record<string, unknown>>(equipment.specs, {});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const images = [
    equipment.image,
    ...(Array.isArray(specs.images) ? specs.images : []),
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  const uniqueImages = Array.from(new Set(images));
  const isOwner = Boolean(viewerId && viewerId === equipment.ownerId);
  const activeImage = uniqueImages[activeImageIndex];

  const handleDelete = async () => {
    if (!confirm("Delete this listing? This action cannot be undone.")) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/equipment/${equipment.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete listing.");
      }
      router.push("/dashboard/listings");
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="relative w-full h-72 bg-gray-100 rounded-lg overflow-hidden">
              {activeImage ? (
                <Image
                  src={activeImage}
                  alt={equipment.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
            </div>

            {uniqueImages.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {uniqueImages.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative w-16 h-16 rounded border ${
                      index === activeImageIndex ? "border-blue-600" : "border-gray-200"
                    }`}
                  >
                    <Image src={src} alt="" fill className="object-cover rounded" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{equipment.title}</h1>
                <p className="text-gray-600">Category: {equipment.category}</p>
                {equipment.location && <p className="text-gray-600">Location: {equipment.location}</p>}
                {equipment.hourMeter !== null && equipment.hourMeter !== undefined && (
                  <p className="text-gray-600">Hour meter: {equipment.hourMeter}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(equipment.dailyRate)}
                </p>
                <p className="text-gray-500">per day</p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">Owner</p>
              <p className="text-gray-900 font-medium">{equipment.owner.name ?? "Owner"}</p>
              {equipment.owner.email ? (
                <a className="text-sm text-blue-600" href={`mailto:${equipment.owner.email}`}>
                  {equipment.owner.email}
                </a>
              ) : (
                <p className="text-sm text-gray-500">
                  <Link href={`/auth/signin?callbackUrl=/equipment/${equipment.id}`}>
                    Sign in to view contact
                  </Link>
                </p>
              )}
            </div>

            {isOwner && (
              <div className="border rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-gray-900">Owner Actions</p>
                <div className="flex flex-wrap gap-3">
                  <Link className="btn-secondary" href={`/owner/listings/${equipment.id}/edit`}>
                    Edit Listing
                  </Link>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete Listing"}
                  </button>
                </div>
                {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
              </div>
            )}

            <div className="border-t pt-6">
              {equipment.available ? (
                <CheckoutFlow
                  equipmentId={equipment.id}
                  dailyRate={equipment.dailyRate}
                  ownerStripeAccountId={equipment.owner.stripeAccountId || ""}
                />
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 font-semibold">Currently unavailable</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="prose max-w-none">
          <h2 className="text-xl font-semibold mb-3">Description</h2>
          <p className="text-gray-700">{equipment.description}</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Technical Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(specs).map(([key, value]) => (
              <div key={key} className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 capitalize">
                  {key.replace(/_/g, " ")}
                </p>
                <p className="text-gray-600">
                  {Array.isArray(value) ? value.join(", ") : String(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 4. CheckoutFlow Component
**File: `components/Stripe/CheckoutFlow.tsx`**
```typescript
"use client";

import CheckoutButton from "@/components/Stripe/CheckoutButton";
import { formatCurrency } from "@/lib/utils";

export default function CheckoutFlow({
  equipmentId,
  dailyRate,
  ownerStripeAccountId,
}: {
  equipmentId: string;
  dailyRate: number;
  ownerStripeAccountId: string;
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        Daily rate: <span className="font-semibold">{formatCurrency(dailyRate)}</span>
      </div>
      <CheckoutButton
        equipmentId={equipmentId}
        dailyRate={dailyRate}
        ownerStripeAccountId={ownerStripeAccountId}
      />
      <p className="text-xs text-gray-500">
        Platform fees are calculated automatically at checkout.
      </p>
    </div>
  );
}
```

`CheckoutButton` (in `components/Stripe/CheckoutButton.tsx`) owns the day selector,
session creation, and Stripe redirect.

### 5. Admin Dashboard Component
**File: `components/Admin/AdminDashboard.tsx`**
```typescript
"use client";

import { useEffect, useState } from "react";
import type { SearchLogAggregate, UnfulfilledSearchesResponse } from "@/lib/types";

export default function AdminDashboard() {
  const [searchLogs, setSearchLogs] = useState<SearchLogAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    days: "30",
    minCount: "0",
    query: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("days", appliedFilters.days);
        if (appliedFilters.minCount) params.set("minCount", appliedFilters.minCount);
        if (appliedFilters.query) params.set("query", appliedFilters.query);

        const res = await fetch(`/api/analytics/unfulfilled-searches?${params.toString()}`);
        const data = (await res.json()) as UnfulfilledSearchesResponse | { error?: string };
        if (!res.ok) {
          throw new Error("error" in data && data.error ? data.error : "Failed to fetch analytics");
        }
        if ("topSearches" in data) {
          setSearchLogs(data.topSearches || []);
        } else {
          setSearchLogs([]);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load analytics");
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [appliedFilters]);

  const topChart = searchLogs.slice(0, 10);
  const maxCount = topChart.reduce((max, item) => Math.max(max, item._count.query), 1);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Admin Analytics Dashboard</h1>

      <form
        className="bg-white border rounded-lg p-4 mb-6 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedFilters(filters);
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="text-sm font-medium">
            Date Range
            <select
              className="input-field w-full mt-2"
              value={filters.days}
              onChange={(e) => setFilters({ ...filters, days: e.target.value })}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Minimum Count
            <input
              className="input-field w-full mt-2"
              type="number"
              min="0"
              value={filters.minCount}
              onChange={(e) => setFilters({ ...filters, minCount: e.target.value })}
            />
          </label>

          <label className="text-sm font-medium">
            Query Filter
            <input
              className="input-field w-full mt-2"
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              placeholder="e.g. telehandler"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Applying..." : "Apply Filters"}
          </button>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              const reset = { days: "30", minCount: "0", query: "" };
              setFilters(reset);
              setAppliedFilters(reset);
            }}
          >
            Reset
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div>Loading analytics...</div>
      ) : (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Top Search Demand</h2>
          {topChart.length ? (
            <div className="space-y-3">
              {topChart.map((item) => (
                <div key={item.query} className="flex items-center gap-3">
                  <div className="w-32 text-xs text-gray-600 truncate">{item.query}</div>
                  <div className="flex-1 bg-gray-100 rounded">
                    <div
                      className="h-2 rounded bg-blue-500"
                      style={{ width: `${(item._count.query / maxCount) * 100}%` }}
                    />
                  </div>
                  <div className="w-10 text-xs text-gray-500 text-right">
                    {item._count.query}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No data available for the selected filters.</p>
          )}
          <div className="mt-4 text-xs text-gray-500">
            Priority thresholds: High &gt; 100, Medium &gt; 50, Low &lt;= 50
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Top Unfulfilled Searches</h2>
          <p className="text-gray-600 text-sm">
            Equipment renters are searching for but not finding
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Search Query
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Priority
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {searchLogs.map((log) => (
                <tr key={log.query} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {log.query}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log._count.query}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        log._count.query > 100
                          ? "bg-red-100 text-red-800"
                          : log._count.query > 50
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {log._count.query > 100
                        ? "High"
                        : log._count.query > 50
                        ? "Medium"
                        : "Low"}
                    </span>
                  </td>
                </tr>
              ))}
              {!searchLogs.length && (
                <tr>
                  <td className="px-6 py-6 text-sm text-gray-600" colSpan={3}>
                    No unfulfilled searches yet.
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
```

---

## Custom Hooks

### useEquipment Hook
**File: `lib/hooks.ts`**
```typescript
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { Equipment } from "@/lib/types";

interface SearchParams {
  query: string;
  category?: string;
}

export function useEquipment(equipmentId: string) {
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEquipment() {
      try {
        const response = await fetch(`/api/equipment/${equipmentId}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setEquipment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchEquipment();
  }, [equipmentId]);

  return { equipment, loading, error };
}

export function useAuth() {
  const { data: session, status } = useSession();
  return {
    session,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };
}

export function useSearch() {
  const [results, setResults] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async ({ query, category }: SearchParams) => {
    const trimmedQuery = query.trim();
    const trimmedCategory = category?.trim();

    if (!trimmedQuery) {
      setError("Search query cannot be empty.");
      return;
    }

    if (trimmedQuery.length > 100) {
      setError("Search query must be 100 characters or fewer.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/equipment/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmedQuery,
          category: trimmedCategory || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Search failed");
      }

      setResults(Array.isArray(data?.results) ? data.results : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
    setLoading(false);
  }, []);

  return { results, loading, error, search, clear };
}
```

---

## Styling with Tailwind

### Global Styles
**File: `styles/globals.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom utilities */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors;
  }

  .btn-secondary {
    @apply px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors;
  }

  .card {
    @apply bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow;
  }

  .input-field {
    @apply px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600;
  }

  .container-lg {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  }
}
```

---

## Pages

### Home Page
**File: `app/page.tsx`**
```typescript
import SearchBar from "@/components/Search/SearchBar";
import EquipmentGrid from "@/components/Equipment/EquipmentGrid";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  // Fetch featured equipment
  const featured = await prisma.equipment.findMany({
    where: { available: true },
    take: 6,
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { name: true, stripeAccountId: true } } },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Rent Heavy Equipment On Demand
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Connect with local equipment owners. Rent telehandlers, boom lifts,
            and construction equipment at competitive rates.
          </p>
          <SearchBar />
        </div>
      </section>

      {/* Featured Equipment */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Featured Equipment
          </h2>
          <EquipmentGrid equipment={featured} />
        </div>
      </section>
    </div>
  );
}
```

### Browse Page
**File: `app/browse/page.tsx`**
```typescript
import EquipmentSearch from "@/components/Search/EquipmentSearch";

export default function BrowsePage() {
  return <EquipmentSearch />;
}
```

---

## Key Development Notes

### Session Management
- Always check `getServerSession(authOptions)` for protected routes
- Use `useSession()` hook in client components
- Redirect to `/auth/signin` if no session

### Error Handling
- Wrap API calls in try-catch
- Show user-friendly error messages
- Log errors for debugging

### Performance
- Use dynamic imports for heavy components
- Implement pagination for lists
- Cache equipment listings with revalidate

### Security
- Verify ownership before operations
- Check admin role on protected routes
- Sanitize search inputs
- Never expose sensitive keys
