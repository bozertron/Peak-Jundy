/**
 * API Route: Create Connected Account
 *
 * POST /api/stripe/connect/account
 *
 * Creates a new Stripe Connected Account for an owner to receive payments.
 * This endpoint should only be called once per user when they complete
 * owner onboarding.
 *
 * Request body:
 * {
 *   displayName: string (owner's name)
 *   contactEmail: string (owner's email)
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   accountId: string (Stripe account ID)
 *   error?: string (if failed)
 * }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { stripeService } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { StripeConnectAccountRequest } from "@/lib/types";

export async function POST(req: Request) {
  try {
    // Verify the user is authenticated
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse request body
    const body = (await req.json()) as StripeConnectAccountRequest;
    const { displayName, contactEmail } = body;

    // Validate required fields
    if (!displayName || !contactEmail) {
      return NextResponse.json(
        { error: "Missing required fields: displayName, contactEmail" },
        { status: 400 }
      );
    }

    // Check if user already has a connected account
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.stripeAccountId) {
      if (user.role === "USER") {
        await prisma.user.update({ where: { id: userId }, data: { role: "OWNER" } });
      }
      return NextResponse.json(
        {
          error: "User already has a connected account",
          accountId: user.stripeAccountId,
        },
        { status: 400 }
      );
    }

    // Create the connected account with Stripe
    const accountId = await stripeService.createConnectedAccount(userId, {
      displayName,
      contactEmail,
    });

    if (user?.role === "USER") {
      await prisma.user.update({ where: { id: userId }, data: { role: "OWNER" } });
    }

    return NextResponse.json(
      {
        success: true,
        accountId,
        message: "Connected account created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating connected account:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create account",
      },
      { status: 500 }
    );
  }
}
