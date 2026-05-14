// API Response Types for Peak
// Provides type safety for all API endpoints

// ============================================================================
// SHARED TYPES
// ============================================================================

export interface ApiError {
  error: string;
}

export interface UserPreview {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface UserProfile extends UserPreview {
  flavor: string | null;
  latitude: number | null;
  longitude: number | null;
  memberSince: Date | null;
  foundingMember: boolean;
}

export interface UserProfileWithLocation extends UserProfile {
  locationName: string | null;
}

// ============================================================================
// TRUST NETWORK TYPES
// ============================================================================

export interface NetworkMember {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  flavor: string | null;
  latitude: number | null;
  longitude: number | null;
  memberSince: Date | null;
  foundingMember: boolean;
  degree: 1 | 2;
  introducedBy: string | null;
}

export interface TrustNetworkStats {
  direct: number;
  extended: number;
  total: number;
}

export interface TrustNetworkResponse {
  network: NetworkMember[];
  stats: TrustNetworkStats;
}

export interface VisibleEquipmentResponse {
  equipment: EquipmentWithOwner[];
  count: number;
}

// ============================================================================
// EQUIPMENT TYPES
// ============================================================================

export interface EquipmentPreview {
  id: string;
  title: string;
  category: string;
  dailyRate: number;
}

export interface EquipmentWithOwner {
  id: string;
  title: string;
  description: string;
  specs: string;
  category: string;
  dailyRate: number;
  available: boolean;
  hourMeter: number | null;
  image: string | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner: UserProfileWithLocation;
}

// ============================================================================
// CONVERSATION TYPES
// ============================================================================

export interface MessagePreview {
  content: string;
  createdAt: Date;
  senderId: string;
}

export interface ConversationEquipmentRef {
  id: string;
  title: string;
}

export interface ConversationListItem {
  id: string;
  participants: UserPreview[];
  equipment: ConversationEquipmentRef | null;
  lastMessage: MessagePreview | null;
  updatedAt: Date;
}

export interface ConversationsListResponse {
  conversations: ConversationListItem[];
}

export interface ConversationDetail {
  id: string;
  participants: UserPreview[];
  equipmentId?: string;
}

export interface CreateConversationResponse {
  conversation: ConversationDetail;
  existing: boolean;
}

// ============================================================================
// CONTACT CARDS TYPES
// ============================================================================

export interface ContactCardSubject extends UserProfile {
  equipmentCount: number;
  equipmentPreview: EquipmentPreview[];
}

export interface ContactCard {
  id: string;
  collectorId: string;
  subjectId: string;
  origin: string;
  createdAt: Date;
  subject: ContactCardSubject;
}

export interface CardsListResponse {
  cards: ContactCard[];
}

// ============================================================================
// PEAKS TYPES
// ============================================================================

export type PeaksReason =
  | 'vouch_given'
  | 'vouch_received'
  | 'first_interaction'
  | 'rental_complete'
  | 'listing_created'
  | 'profile_complete'
  | 'founding_bonus'
  | 'chest_opened';

export interface PeaksTransaction {
  id: string;
  amount: number;
  reason: string;
  createdAt: Date;
  referenceType: string | null;
}

export interface PeaksBalanceResponse {
  balance: number;
  history: PeaksTransaction[] | null;
}

export interface PeaksAwardResponse {
  transaction: PeaksTransaction;
  balance: number;
  awarded: number;
}

export interface PeaksAwardError extends ApiError {
  transaction?: PeaksTransaction;
}

// ============================================================================
// TREASURE CHEST TYPES
// ============================================================================

export type ChestPrizeType = 'discount' | 'peaks' | 'equipment' | 'badge';

export interface TreasureChest {
  id: string;
  title: string;
  description: string;
  peaksCost: number;
  prizeType: ChestPrizeType;
  available: boolean;
  createdAt: Date;
  claimedAt: Date | null;
  prizeValue?: string; // Only included when claimed by current user
}

export interface ChestsListResponse {
  chests: TreasureChest[];
  userBalance: number;
}

export interface ChestPrize {
  description?: string;
  [key: string]: unknown;
}

export interface ChestClaimResponse {
  success: true;
  chest: {
    id: string;
    title: string;
    prizeType: ChestPrizeType;
    prize: ChestPrize;
  };
  newBalance: number;
}

export interface ChestClaimError extends ApiError {
  required?: number;
  current?: number;
}

// ============================================================================
// VOUCH TYPES
// ============================================================================

export interface VouchRecord {
  id: string;
  voucherId: string;
  voucheeId: string;
  broadcast: boolean;
  broadcastAt: Date | null;
  createdAt: Date;
  voucher?: UserPreview;
  vouchee?: UserPreview;
}

export interface VouchListResponse {
  sent: VouchRecord[];
  received: VouchRecord[];
}

export interface CreateVouchResponse {
  vouch: VouchRecord;
}

export interface BroadcastVouchResponse {
  vouch: VouchRecord;
  peaksAwarded: number;
}
