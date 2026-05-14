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

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: params.id },
      include: { owner: { select: { name: true, stripeAccountId: true } } },
    });

    if (!equipment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("GET /api/equipment/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      title,
      description,
      category,
      specs,
      dailyRate,
      dailyRateCents,
      available,
      hourMeter,
      image,
      location,
    } = body;

    const existing = await prisma.equipment.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Equipment not found" }, { status: 404 });

    if (existing.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to update this equipment" }, { status: 403 });
    }

    const dailyRateNumber =
      dailyRate === undefined && dailyRateCents === undefined
        ? existing.dailyRate
        : normalizeDailyRate(dailyRate, dailyRateCents);
    const hourMeterValue =
      hourMeter === undefined
        ? existing.hourMeter
        : hourMeter === null || hourMeter === ""
        ? null
        : Number(hourMeter);

    const normalizedSpecs =
      specs === undefined ? existing.specs : normalizeSpecs(specs);

    const normalizedImage =
      image === undefined
        ? existing.image
        : image === null
        ? null
        : typeof image === "string"
        ? image.trim() || null
        : existing.image;

    const normalizedLocation =
      location === undefined
        ? existing.location
        : location === null
        ? null
        : typeof location === "string"
        ? location.trim() || null
        : existing.location;

    const validationInput = {
      title: typeof title === "string" ? title : existing.title,
      description:
        typeof description === "string" ? description : existing.description,
      category: typeof category === "string" ? category : existing.category,
      specs: normalizedSpecs,
      dailyRate: dailyRateNumber ?? existing.dailyRate,
      available: typeof available === "boolean" ? available : existing.available,
      hourMeter: hourMeterValue ?? null,
      image: normalizedImage ?? null,
      location: normalizedLocation ?? null,
    };

    const errors = validateEquipment(validationInput);
    if (hasErrors(errors)) {
      return NextResponse.json(formatValidationErrors(errors), { status: 400 });
    }

    if (dailyRateNumber === null) {
      return NextResponse.json(
        { error: "Invalid daily rate" },
        { status: 400 }
      );
    }

    const updated = await prisma.equipment.update({
      where: { id: params.id },
      data: {
        title: validationInput.title,
        description: validationInput.description,
        category: validationInput.category,
        specs: validationInput.specs,
        dailyRate: dailyRateNumber,
        available: validationInput.available,
        hourMeter: hourMeterValue,
        image: normalizedImage,
        location: normalizedLocation,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/equipment/[id] error:", error);
    return NextResponse.json({ error: "Failed to update equipment" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const existing = await prisma.equipment.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Equipment not found" }, { status: 404 });

    if (existing.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to delete this equipment" }, { status: 403 });
    }

    await prisma.equipment.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Equipment deleted" });
  } catch (error) {
    console.error("DELETE /api/equipment/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete equipment" }, { status: 500 });
  }
}
