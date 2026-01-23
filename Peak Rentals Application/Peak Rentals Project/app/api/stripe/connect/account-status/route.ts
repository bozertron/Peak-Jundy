/**
 * API Route: Get Account Status
 *
 * GET /api/stripe/connect/account-status?accountId=acct_123
 *
 * Retrieves the current onboarding and capability status of a
 * connected account. This includes:
 * - Whether the account is ready to receive payments
 * - Any pending requirements that need to be completed
 * - Deadline information for requirements
 *
 * Query params:
 * - accountId: The Stripe account ID
 *
 * Response:
 * {
 *   success: boolean
 *   status: {
 *     accountId: string
 *     readyForPayments: boolean
 *     readyToReceivePayments: boolean
 *     hasUnmetRequirements: boolean
 *     requirementsStatus: string
 *     currentlyDue: string[] (list of required fields)
 *     pastDue: string[] (overdue requirements)
 *   }
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

    // Retrieve the account status from Stripe
    const status = await stripeService.getAccountStatus(accountId);

    return NextResponse.json(
      {
        success: true,
        status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving account status:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to retrieve status",
      },
      { status: 500 }
    );
  }
}
