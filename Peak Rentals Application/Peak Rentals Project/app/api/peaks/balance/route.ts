// GET /api/peaks/balance - Get user's Peaks balance and transaction history
// POST /api/peaks/balance - Award Peaks for actions

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ============================================================
// TypeScript Types
// ============================================================

/** Tier names for the Peaks loyalty program */
type PeaksTierName =
  | "Explorer"
  | "Trailblazer"
  | "Summit Seeker"
  | "Peak Patron"
  | "Alpine Elite";

/** Tier configuration with thresholds and benefits */
interface PeaksTier {
  name: PeaksTierName;
  minPeaks: number;
  maxPeaks: number | null; // null means unlimited
  color: string;
  benefits: string[];
}

/** Transaction record returned from the API */
interface PeaksTransactionRecord {
  id: string;
  amount: number;
  reason: string;
  createdAt: Date;
  referenceType: string | null;
}

/** Complete balance response with tier info */
interface PeaksBalanceResponse {
  balance: number;
  lifetimePeaks: number;
  tier: {
    current: PeaksTierName;
    color: string;
    benefits: string[];
    progress: {
      currentMin: number;
      nextTierMin: number | null;
      progressPercent: number;
    };
  };
  recentTransactions: PeaksTransactionRecord[] | null;
}

/** Error response type */
interface ErrorResponse {
  error: string;
}

/** POST request body */
interface AwardPeaksRequest {
  reason: string;
  referenceId?: string;
  referenceType?: string;
}

/** POST response type */
interface AwardPeaksResponse {
  transaction: PeaksTransactionRecord;
  balance: number;
  awarded: number;
}

// ============================================================
// Constants
// ============================================================

/** Points values for different actions */
const PEAKS_VALUES: Record<string, number> = {
  vouch_given: 5,
  vouch_received: 3,
  first_interaction: 10,
  rental_complete: 25,
  listing_created: 5,
  profile_complete: 10,
  founding_bonus: 100,
};

/** Tier definitions with thresholds and benefits */
const PEAKS_TIERS: PeaksTier[] = [
  {
    name: "Explorer",
    minPeaks: 0,
    maxPeaks: 99,
    color: "#8B9DC3", // Soft blue-gray
    benefits: [
      "Access to community marketplace",
      "Basic trust network participation",
    ],
  },
  {
    name: "Trailblazer",
    minPeaks: 100,
    maxPeaks: 499,
    color: "#5D8AA8", // Air Force blue
    benefits: [
      "Priority search placement",
      "Extended vouch network visibility",
      "Trailblazer badge on profile",
    ],
  },
  {
    name: "Summit Seeker",
    minPeaks: 500,
    maxPeaks: 1499,
    color: "#4A90A4", // Steel teal
    benefits: [
      "Featured listings opportunity",
      "Early access to treasure chests",
      "Summit Seeker badge on profile",
      "Reduced platform fees (5% off)",
    ],
  },
  {
    name: "Peak Patron",
    minPeaks: 1500,
    maxPeaks: 4999,
    color: "#FFD700", // Gold
    benefits: [
      "Premium listing spotlight",
      "VIP support channel",
      "Peak Patron badge on profile",
      "Reduced platform fees (10% off)",
      "Exclusive community events access",
    ],
  },
  {
    name: "Alpine Elite",
    minPeaks: 5000,
    maxPeaks: null, // Unlimited
    color: "#E5E4E2", // Platinum
    benefits: [
      "Founding member recognition",
      "Maximum trust visibility",
      "Alpine Elite badge on profile",
      "Reduced platform fees (15% off)",
      "Priority feature requests",
      "Beta access to new features",
      "Annual Peaks bonus",
    ],
  },
];

// ============================================================
// Helper Functions
// ============================================================

/**
 * Calculate the user's tier based on lifetime Peaks earned
 */
function calculateTier(lifetimePeaks: number): PeaksTier {
  // Find the highest tier the user qualifies for
  for (let i = PEAKS_TIERS.length - 1; i >= 0; i--) {
    const tier = PEAKS_TIERS[i];
    if (tier && lifetimePeaks >= tier.minPeaks) {
      return tier;
    }
  }
  // Default to first tier (always exists)
  return PEAKS_TIERS[0] as PeaksTier;
}

/**
 * Calculate progress toward the next tier
 */
function calculateProgress(lifetimePeaks: number, currentTier: PeaksTier): {
  currentMin: number;
  nextTierMin: number | null;
  progressPercent: number;
} {
  const currentTierIndex = PEAKS_TIERS.findIndex(
    (t) => t.name === currentTier.name
  );
  const nextTier = PEAKS_TIERS[currentTierIndex + 1];

  if (!nextTier) {
    // Already at max tier
    return {
      currentMin: currentTier.minPeaks,
      nextTierMin: null,
      progressPercent: 100,
    };
  }

  const tierRange = nextTier.minPeaks - currentTier.minPeaks;
  const peaksInTier = lifetimePeaks - currentTier.minPeaks;
  const progressPercent = Math.min(
    Math.round((peaksInTier / tierRange) * 100),
    100
  );

  return {
    currentMin: currentTier.minPeaks,
    nextTierMin: nextTier.minPeaks,
    progressPercent,
  };
}

// ============================================================
// API Route Handlers
// ============================================================

/**
 * GET /api/peaks/balance
 *
 * Get user's Peaks balance, tier information, and transaction history.
 *
 * Query parameters:
 * - history: "true" to include recent transactions (default: false)
 * - limit: number of transactions to return (default: 20)
 *
 * Response: PeaksBalanceResponse
 */
export async function GET(
  request: Request
): Promise<NextResponse<PeaksBalanceResponse | ErrorResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeHistory = searchParams.get("history") === "true";
  const limit = parseInt(searchParams.get("limit") || "20");

  // Get user's current balance
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { peaksBalance: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Calculate lifetime Peaks (sum of all positive transactions)
  const lifetimeResult = await prisma.peaksTransaction.aggregate({
    where: {
      userId: session.user.id,
      amount: { gt: 0 },
    },
    _sum: {
      amount: true,
    },
  });

  const lifetimePeaks = lifetimeResult._sum.amount || 0;

  // Calculate tier based on lifetime earnings
  const currentTier = calculateTier(lifetimePeaks);
  const progress = calculateProgress(lifetimePeaks, currentTier);

  // Get recent transactions if requested
  let recentTransactions: PeaksTransactionRecord[] | null = null;
  if (includeHistory) {
    recentTransactions = await prisma.peaksTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        amount: true,
        reason: true,
        createdAt: true,
        referenceType: true,
      },
    });
  }

  const response: PeaksBalanceResponse = {
    balance: user.peaksBalance,
    lifetimePeaks,
    tier: {
      current: currentTier.name,
      color: currentTier.color,
      benefits: currentTier.benefits,
      progress,
    },
    recentTransactions,
  };

  return NextResponse.json(response);
}

/**
 * POST /api/peaks/balance
 *
 * Award Peaks points to the authenticated user.
 *
 * Request body:
 * - reason: string (must be a valid reason from PEAKS_VALUES)
 * - referenceId?: string (optional, prevents duplicate awards)
 * - referenceType?: string (optional, categorizes the reference)
 *
 * Response: AwardPeaksResponse
 */
export async function POST(
  request: Request
): Promise<NextResponse<AwardPeaksResponse | ErrorResponse & { transaction?: PeaksTransactionRecord }>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reason, referenceId, referenceType }: AwardPeaksRequest =
    await request.json();

  // Validate reason
  if (!reason || !PEAKS_VALUES[reason]) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const amount = PEAKS_VALUES[reason];

  // Prevent duplicate awards for same reference
  if (referenceId) {
    const existing = await prisma.peaksTransaction.findFirst({
      where: {
        userId: session.user.id,
        reason,
        referenceId,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "Already awarded",
          transaction: existing as PeaksTransactionRecord,
        },
        { status: 400 }
      );
    }
  }

  // Create transaction and update balance
  const transaction = await prisma.peaksTransaction.create({
    data: {
      userId: session.user.id,
      amount,
      reason,
      referenceId,
      referenceType,
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { peaksBalance: { increment: amount } },
  });

  // Get updated balance
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { peaksBalance: true },
  });

  return NextResponse.json(
    {
      transaction: transaction as PeaksTransactionRecord,
      balance: user?.peaksBalance || 0,
      awarded: amount,
    },
    { status: 201 }
  );
}
