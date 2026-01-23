import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  formatValidationErrors,
  hasErrors,
  validateEquipment,
} from "@/lib/validation";

function normalizeSpecs(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }
  return "{}";
}

function normalizeDailyRate(
  dailyRate: unknown,
  dailyRateCents: unknown
): number | null {
  const raw =
    dailyRateCents !== undefined && dailyRateCents !== null ? dailyRateCents : dailyRate;
  if (raw === undefined || raw === null || raw === "") return null;

  const numeric =
    typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;

  if (!Number.isFinite(numeric) || numeric < 0) return null;

  if (dailyRateCents !== undefined && dailyRateCents !== null) {
    return Math.round(numeric);
  }

  // Assume dollars unless the value already looks like cents (>= 10000).
  return Math.round(numeric >= 10000 ? numeric : numeric * 100);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const available = searchParams.get("available");
  const skip = Number(searchParams.get("skip") || "0");
  const take = Math.min(Number(searchParams.get("take") || "20"), 100); // limit to 100

  try {
    const where = {
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : {}),
      ...(category ? { category } : {}),
      ...(available !== null ? { available: available === "true" } : {}),
    };

    const [equipment, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        include: { owner: { select: { name: true, stripeAccountId: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.equipment.count({ where }),
    ]);

    return NextResponse.json(
      {
        equipment,
        pagination: {
          total,
          page: Math.floor(skip / take) + 1,
          pages: Math.ceil(total / take),
          hasMore: skip + take < total,
        },
      },
      {
        headers: {
          "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/equipment error:", error);
    return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      specs,
      category,
      dailyRate,
      dailyRateCents,
      available,
      hourMeter,
      image,
      location,
    } = body;

    const dailyRateNumber = normalizeDailyRate(dailyRate, dailyRateCents);
    const hourMeterNumber =
      hourMeter === null || hourMeter === undefined || hourMeter === ""
        ? null
        : Number(hourMeter);

    const normalized = {
      title: typeof title === "string" ? title : "",
      description: typeof description === "string" ? description : "",
      category: typeof category === "string" ? category : "",
      dailyRate: dailyRateNumber,
      available: typeof available === "boolean" ? available : true,
      specs: normalizeSpecs(specs),
      hourMeter: hourMeterNumber,
      image: typeof image === "string" ? image.trim() || null : null,
      location:
        typeof location === "string" ? location.trim() || null : null,
    };

    const errors = validateEquipment(normalized);
    if (hasErrors(errors)) {
      return NextResponse.json(formatValidationErrors(errors), { status: 400 });
    }

    if (dailyRateNumber === null) {
      return NextResponse.json(
        { error: "Invalid daily rate" },
        { status: 400 }
      );
    }

    const equipment = await prisma.equipment.create({
      data: {
        title: normalized.title,
        description: normalized.description,
        specs: normalized.specs, // stored as JSON string
        category: normalized.category,
        dailyRate: dailyRateNumber, // store in cents
        available: normalized.available,
        hourMeter: normalized.hourMeter,
        image: normalized.image ?? null,
        location: normalized.location ?? null,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(equipment, { status: 201 });
  } catch (error) {
    console.error("POST /api/equipment error:", error);
    return NextResponse.json({ error: "Failed to create equipment" }, { status: 500 });
  }
}
