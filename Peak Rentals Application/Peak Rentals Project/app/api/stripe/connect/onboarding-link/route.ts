/**
 * API Route: Get Account Onboarding Link
 *
 * GET /api/stripe/connect/onboarding-link?accountId=acct_123
 *
 * Generates an onboarding link that directs the owner to Stripe's
 * hosted pages where they can:
 * - Verify their identity
 * - Add banking information
 * - Accept the Stripe Connected Account Agreement
 *
 * The link expires after 24 hours.
 *
 * Query params:
 * - accountId: The Stripe account ID to onboard
 *
 * Response:
 * {
 *   success: boolean
 *   url: string (link to redirect user to)
 *   error?: string (if failed)
 * }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { stripeService } from "@/lib/stripe";

export async function GET(req: Request) {
  try {
    // Verify the user is authenticated
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }

    // Extract account ID from query parameters
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        { error: "Missing required query parameter: accountId" },
        { status: 400 }
      );
    }

    // Generate the onboarding link
    const onboardingUrl = await stripeService.createAccountLink(accountId);

    return NextResponse.json(
      {
        success: true,
        url: onboardingUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating onboarding link:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate link",
      },
      { status: 500 }
    );
  }
}
