/**
 * Peak Rentals - Peaks Rewards System
 * "Sophisticated Ski Chalet" - A distinguished rewards currency for the discerning community
 *
 * Peaks are the currency of trust and engagement within Peak Rentals. Much like
 * the summit markers on a mountain trail, they represent milestones of meaningful
 * participation. This is not gamification for its own sake - it is recognition
 * of the bonds forged between community members.
 *
 * Created: January 23, 2026
 */

// ============================================================================
// TYPES - The Language of Recognition
// ============================================================================

/**
 * The occasions upon which Peaks are bestowed
 * Each reason represents a meaningful moment in the community journey
 */
export type PeaksTransactionReason =
  | 'rental_complete'      // A successful exchange - trust fulfilled
  | 'vouch_given'          // Extending one's network - a vote of confidence
  | 'first_interaction'    // The beginning of a connection
  | 'chest_opened'         // Claiming a reward from the treasure trove
  | 'founding_bonus'       // Recognition for early believers
  | 'profile_complete'     // Investing in one's presence
  | 'referral_success'     // Bringing new members to the lodge
  | 'seasonal_bonus'       // Celebration of continued engagement
  | 'admin_adjustment';    // Administrative correction

/**
 * Reference types for transaction provenance
 * Every Peak has a story - these tell us where it came from
 */
export type PeaksReferenceType =
  | 'booking'
  | 'vouch'
  | 'chest'
  | 'profile'
  | 'referral'
  | 'system';

/**
 * A record of Peaks movement
 * The ledger of community recognition
 */
export interface PeaksTransaction {
  id: string;
  createdAt: Date;
  userId: string;
  amount: number;           // Positive: earned, Negative: spent
  reason: PeaksTransactionReason;
  referenceId?: string;
  referenceType?: PeaksReferenceType;
}

/**
 * Summary of a member's Peaks standing
 */
export interface PeaksBalance {
  current: number;          // Available Peaks
  lifetime: number;         // Total ever earned
  spent: number;            // Total redeemed
  rank: PeaksMemberTier;    // Current standing
}

/**
 * Member tiers - The lodges of distinction
 * Like the different chalets on the mountain, each offers its own view
 */
export type PeaksMemberTier =
  | 'Explorer'              // Beginning the journey (0-99 Peaks)
  | 'Trailblazer'           // Finding their path (100-499 Peaks)
  | 'Summit Seeker'         // Ascending with purpose (500-1499 Peaks)
  | 'Peak Patron'           // A pillar of the community (1500-4999 Peaks)
  | 'Alpine Elite';         // The summit achieved (5000+ Peaks)

// ============================================================================
// CONSTANTS - The Economy of Recognition
// ============================================================================

/**
 * Peaks awarded for each meaningful action
 * Calibrated to reflect the value of trust and engagement
 */
export const PEAKS_AMOUNTS = {
  // Core transactions - The foundation of trust
  RENTAL_COMPLETE: 25,              // A successful rental builds community
  RENTAL_COMPLETE_FIRST: 50,        // First rental deserves extra recognition

  // Trust network - The bonds that bind
  VOUCH_GIVEN: 5,                   // Vouching for another
  VOUCH_RECEIVED_BROADCAST: 10,     // Being publicly endorsed
  FIRST_INTERACTION: 3,             // Starting a conversation

  // Community engagement
  PROFILE_COMPLETE: 15,             // A thoughtful profile
  REFERRAL_SUCCESS: 50,             // Bringing new members
  FOUNDING_MEMBER_BONUS: 500,       // Early believers

  // Treasure chests - Variable costs
  CHEST_COST_BRONZE: 25,            // Entry level rewards
  CHEST_COST_SILVER: 75,            // Distinguished rewards
  CHEST_COST_GOLD: 200,             // Premium experiences
  CHEST_COST_PLATINUM: 500,         // Exceptional offerings

  // Seasonal recognition
  SEASONAL_ACTIVITY_BONUS: 20,      // Active participation
} as const;

/**
 * Tier thresholds - The elevation markers
 */
export const PEAKS_TIER_THRESHOLDS = {
  Explorer: 0,
  Trailblazer: 100,
  'Summit Seeker': 500,
  'Peak Patron': 1500,
  'Alpine Elite': 5000,
} as const;

/**
 * Human-readable descriptions for transaction reasons
 * For the refined presentation of one's history
 */
export const PEAKS_REASON_LABELS: Record<PeaksTransactionReason, string> = {
  rental_complete: 'Completed Rental',
  vouch_given: 'Vouch Extended',
  first_interaction: 'New Connection',
  chest_opened: 'Treasure Claimed',
  founding_bonus: 'Founding Member Recognition',
  profile_complete: 'Profile Completed',
  referral_success: 'Successful Referral',
  seasonal_bonus: 'Seasonal Recognition',
  admin_adjustment: 'Account Adjustment',
} as const;

// ============================================================================
// CALCULATION FUNCTIONS - The Arithmetic of Merit
// ============================================================================

/**
 * Calculate Peaks earned for a completed rental
 * The first rental is particularly celebrated
 */
export function calculateRentalPeaks(
  isFirstRental: boolean,
  rentalDays: number = 1
): number {
  const base = isFirstRental
    ? PEAKS_AMOUNTS.RENTAL_COMPLETE_FIRST
    : PEAKS_AMOUNTS.RENTAL_COMPLETE;

  // Longer rentals show greater commitment - modest bonus
  const durationBonus = Math.min(Math.floor(rentalDays / 7) * 5, 25);

  return base + durationBonus;
}

/**
 * Calculate Peaks earned for vouching activity
 * Both the voucher and the endorsed benefit
 */
export function calculateVouchPeaks(
  isBroadcast: boolean
): { voucher: number; vouchee: number } {
  return {
    voucher: PEAKS_AMOUNTS.VOUCH_GIVEN,
    vouchee: isBroadcast ? PEAKS_AMOUNTS.VOUCH_RECEIVED_BROADCAST : 0,
  };
}

/**
 * Calculate Peaks for a first interaction
 * The spark of connection
 */
export function calculateFirstInteractionPeaks(): number {
  return PEAKS_AMOUNTS.FIRST_INTERACTION;
}

/**
 * Calculate the cost of opening a treasure chest
 * Based on the chest's distinction level
 */
export function calculateChestCost(
  chestTier: 'bronze' | 'silver' | 'gold' | 'platinum'
): number {
  const costs: Record<string, number> = {
    bronze: PEAKS_AMOUNTS.CHEST_COST_BRONZE,
    silver: PEAKS_AMOUNTS.CHEST_COST_SILVER,
    gold: PEAKS_AMOUNTS.CHEST_COST_GOLD,
    platinum: PEAKS_AMOUNTS.CHEST_COST_PLATINUM,
  };
  return costs[chestTier] ?? PEAKS_AMOUNTS.CHEST_COST_BRONZE;
}

/**
 * Calculate referral bonus
 * Rewarding those who expand the community
 */
export function calculateReferralPeaks(): number {
  return PEAKS_AMOUNTS.REFERRAL_SUCCESS;
}

// ============================================================================
// BALANCE UTILITIES - Stewardship of Standing
// ============================================================================

/**
 * Determine member tier based on lifetime Peaks
 * One's place in the mountain community
 */
export function determineTier(lifetimePeaks: number): PeaksMemberTier {
  if (lifetimePeaks >= PEAKS_TIER_THRESHOLDS['Alpine Elite']) {
    return 'Alpine Elite';
  }
  if (lifetimePeaks >= PEAKS_TIER_THRESHOLDS['Peak Patron']) {
    return 'Peak Patron';
  }
  if (lifetimePeaks >= PEAKS_TIER_THRESHOLDS['Summit Seeker']) {
    return 'Summit Seeker';
  }
  if (lifetimePeaks >= PEAKS_TIER_THRESHOLDS['Trailblazer']) {
    return 'Trailblazer';
  }
  return 'Explorer';
}

/**
 * Calculate progress toward the next tier
 * How far until the next summit?
 */
export function calculateTierProgress(lifetimePeaks: number): {
  currentTier: PeaksMemberTier;
  nextTier: PeaksMemberTier | null;
  peaksToNextTier: number;
  progressPercent: number;
} {
  const currentTier = determineTier(lifetimePeaks);

  const tierOrder: PeaksMemberTier[] = [
    'Explorer',
    'Trailblazer',
    'Summit Seeker',
    'Peak Patron',
    'Alpine Elite',
  ];

  const currentIndex = tierOrder.indexOf(currentTier);
  const nextTier = currentIndex < tierOrder.length - 1
    ? tierOrder[currentIndex + 1]
    : null;

  if (!nextTier) {
    // Already at the summit
    return {
      currentTier,
      nextTier: null,
      peaksToNextTier: 0,
      progressPercent: 100,
    };
  }

  const currentThreshold = PEAKS_TIER_THRESHOLDS[currentTier];
  const nextThreshold = PEAKS_TIER_THRESHOLDS[nextTier];
  const tierRange = nextThreshold - currentThreshold;
  const progressInTier = lifetimePeaks - currentThreshold;

  return {
    currentTier,
    nextTier,
    peaksToNextTier: nextThreshold - lifetimePeaks,
    progressPercent: Math.min(Math.round((progressInTier / tierRange) * 100), 100),
  };
}

/**
 * Calculate complete balance summary from transactions
 * A full accounting of one's Peaks journey
 */
export function calculateBalanceSummary(
  transactions: Pick<PeaksTransaction, 'amount'>[]
): PeaksBalance {
  let lifetime = 0;
  let spent = 0;

  for (const tx of transactions) {
    if (tx.amount > 0) {
      lifetime += tx.amount;
    } else {
      spent += Math.abs(tx.amount);
    }
  }

  const current = lifetime - spent;
  const rank = determineTier(lifetime);

  return { current, lifetime, spent, rank };
}

/**
 * Verify sufficient balance for a transaction
 * One cannot spend what one does not have
 */
export function hasSufficientPeaks(
  currentBalance: number,
  requiredAmount: number
): boolean {
  return currentBalance >= requiredAmount;
}

// ============================================================================
// DISPLAY UTILITIES - The Art of Presentation
// ============================================================================

/**
 * Format Peaks for distinguished display
 * With appropriate notation for this mountain currency
 */
export function formatPeaks(
  amount: number,
  options: {
    showSign?: boolean;      // Show +/- prefix
    compact?: boolean;       // Use K notation for large amounts
    includeSymbol?: boolean; // Include the mountain symbol
  } = {}
): string {
  const { showSign = false, compact = false, includeSymbol = true } = options;

  let formatted: string;

  if (compact && Math.abs(amount) >= 1000) {
    const value = amount / 1000;
    formatted = `${value.toFixed(1).replace(/\.0$/, '')}K`;
  } else {
    formatted = amount.toLocaleString('en-US');
  }

  // Add sign if requested and amount is positive
  if (showSign && amount > 0) {
    formatted = `+${formatted}`;
  }

  // Prepend the mountain peak symbol
  if (includeSymbol) {
    formatted = `\u26F0 ${formatted}`; // Unicode mountain symbol
  }

  return formatted;
}

/**
 * Format a transaction for display
 * Presenting the story of each Peak movement
 */
export function formatPeaksTransaction(transaction: PeaksTransaction): {
  label: string;
  amount: string;
  isPositive: boolean;
  timestamp: string;
} {
  const label = PEAKS_REASON_LABELS[transaction.reason] ?? 'Transaction';
  const isPositive = transaction.amount > 0;
  const amount = formatPeaks(transaction.amount, { showSign: true });

  const dateValue = transaction.createdAt instanceof Date
    ? transaction.createdAt
    : new Date(transaction.createdAt);

  const timestamp = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateValue);

  return { label, amount, isPositive, timestamp };
}

/**
 * Get tier display information
 * For badges and status indicators
 */
export function getTierDisplay(tier: PeaksMemberTier): {
  name: string;
  color: string;
  description: string;
} {
  const tierInfo: Record<PeaksMemberTier, { color: string; description: string }> = {
    Explorer: {
      color: '#9C968C',  // Stone gray - beginning the journey
      description: 'Beginning the mountain journey',
    },
    Trailblazer: {
      color: '#5A917A',  // Forest green - finding the path
      description: 'Forging connections on the trail',
    },
    'Summit Seeker': {
      color: '#B87333',  // Copper - ascending with purpose
      description: 'Ascending toward the peaks',
    },
    'Peak Patron': {
      color: '#B8860B',  // Warm brass - community pillar
      description: 'A distinguished member of the lodge',
    },
    'Alpine Elite': {
      color: '#722F37',  // Burgundy - the summit achieved
      description: 'At the pinnacle of Peak Rentals',
    },
  };

  const info = tierInfo[tier];
  return {
    name: tier,
    color: info.color,
    description: info.description,
  };
}

/**
 * Generate a celebratory message for earning Peaks
 * Because recognition should feel meaningful
 */
export function getPeaksEarnedMessage(
  amount: number,
  reason: PeaksTransactionReason
): string {
  const messages: Record<PeaksTransactionReason, string> = {
    rental_complete: `A successful exchange. You've earned ${formatPeaks(amount)} for building trust.`,
    vouch_given: `Your endorsement carries weight. ${formatPeaks(amount)} added to your standing.`,
    first_interaction: `A new connection begins. ${formatPeaks(amount)} to mark the moment.`,
    chest_opened: `From the treasure trove, a discovery awaits.`,
    founding_bonus: `As a founding member, ${formatPeaks(amount)} honor your early belief.`,
    profile_complete: `A thoughtful profile speaks volumes. ${formatPeaks(amount)} earned.`,
    referral_success: `Welcoming new members strengthens us all. ${formatPeaks(amount)} in gratitude.`,
    seasonal_bonus: `The season celebrates your engagement. ${formatPeaks(amount)} bestowed.`,
    admin_adjustment: `Your account has been adjusted by ${formatPeaks(amount, { showSign: true })}.`,
  };

  return messages[reason] ?? `${formatPeaks(amount, { showSign: true })} added to your balance.`;
}

// ============================================================================
// VALIDATION UTILITIES - Ensuring Integrity
// ============================================================================

/**
 * Validate a Peaks transaction reason
 */
export function isValidPeaksReason(reason: string): reason is PeaksTransactionReason {
  const validReasons: Record<string, boolean> = {
    rental_complete: true,
    vouch_given: true,
    first_interaction: true,
    chest_opened: true,
    founding_bonus: true,
    profile_complete: true,
    referral_success: true,
    seasonal_bonus: true,
    admin_adjustment: true,
  };
  return reason in validReasons;
}

/**
 * Validate a reference type
 */
export function isValidReferenceType(type: string): type is PeaksReferenceType {
  const validTypes: Record<string, boolean> = {
    booking: true,
    vouch: true,
    chest: true,
    profile: true,
    referral: true,
    system: true,
  };
  return type in validTypes;
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

const peaks = {
  // Constants
  AMOUNTS: PEAKS_AMOUNTS,
  TIER_THRESHOLDS: PEAKS_TIER_THRESHOLDS,
  REASON_LABELS: PEAKS_REASON_LABELS,

  // Calculations
  calculateRentalPeaks,
  calculateVouchPeaks,
  calculateFirstInteractionPeaks,
  calculateChestCost,
  calculateReferralPeaks,

  // Balance
  determineTier,
  calculateTierProgress,
  calculateBalanceSummary,
  hasSufficientPeaks,

  // Display
  formatPeaks,
  formatPeaksTransaction,
  getTierDisplay,
  getPeaksEarnedMessage,

  // Validation
  isValidPeaksReason,
  isValidReferenceType,
} as const;

export default peaks;
