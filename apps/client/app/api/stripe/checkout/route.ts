import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripeService } from "@/lib/stripe";
import {
  formatValidationErrors,
  hasErrors,
  validateCheckout,
} from "@/lib/validation";
import type { StripeCheckoutRequest } from "@/lib/types";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json()) as StripeCheckoutRequest;
    const equipmentId =
      typeof body.equipmentId === "string" ? body.equipmentId : "";
    const days = Number(body.days);

    const errors = validateCheckout({ equipmentId, days });
    if (hasErrors(errors)) {
      return NextResponse.json(formatValidationErrors(errors), { status: 400 });
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: { owner: true },
    });

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }
    if (!equipment.available) {
      return NextResponse.json({ error: "Equipment unavailable" }, { status: 400 });
    }
    if (!equipment.owner.stripeAccountId) {
      return NextResponse.json({ error: "Owner not onboarded to Stripe" }, { status: 400 });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);
    const totalPrice = equipment.dailyRate * days; // already in cents

    const checkout = await stripeService.createCheckoutSession({
      equipmentId,
      dailyRate: equipment.dailyRate, // already in cents
      days,
      renterId: session.user.id,
      ownerStripeAccountId: equipment.owner.stripeAccountId,
      equipmentTitle: equipment.title,
      equipmentDescription: equipment.description,
    });

    await prisma.booking.create({
      data: {
        equipmentId,
        renterId: session.user.id,
        startDate,
        endDate,
        totalPrice,
        status: "PENDING",
        stripeSessionId: checkout.id,
      },
    });

    return NextResponse.json({ sessionId: checkout.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
