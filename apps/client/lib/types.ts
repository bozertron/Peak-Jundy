/**
 * TypeScript interfaces for Peak
 * Provides strict typing for all data models
 */

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  stripeAccountId: string | null;
  role: "USER" | "OWNER" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}

export interface Equipment {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  description: string;
  specs: string; // JSON string
  category: string;
  ownerId: string;
  dailyRate: number; // in cents
  available: boolean;
  hourMeter?: number | null;
  image?: string | null;
  location?: string | null;
  owner: {
    name: string | null;
    stripeAccountId: string | null;
  };
}

export interface EquipmentWithOwner extends Omit<Equipment, 'owner'> {
  owner: User;
}

export interface Booking {
  id: string;
  createdAt: Date;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
  equipmentId: string;
  renterId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number; // in cents
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  stripeSessionId?: string | null;
}

export interface BookingWithDetails extends Booking {
  equipment: Equipment;
  renter: User;
}

export interface SearchLog {
  id: number;
  query: string;
  userId?: string | null;
  timestamp: Date;
  fulfilled: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  errors?: Record<string, string>;
  message?: string;
}

export interface EquipmentListResponse {
  equipment: Equipment[];
  total?: number;
  page?: number;
}

export interface AnalyticsResponse {
  topSearches?: Array<{ query: string; count: number }>;
  total?: number;
  equipmentCount?: number;
  bookingCount?: number;
  completedBookings?: number;
  totalRevenue?: number;
}

export interface SearchLogAggregate {
  query: string;
  _count: { query: number };
}

export interface UnfulfilledSearchesResponse {
  topSearches: SearchLogAggregate[];
  meta: { days: number; minCount: number; query: string };
}

export interface MarketGapsResponse {
  since: string;
  gaps: SearchLogAggregate[];
}

export interface OwnerStatsResponse {
  equipmentCount: number;
  bookingCount: number;
  revenueCents: number;
}

export type BookingsResponse = BookingWithDetails[];

// API Request Types
export interface EquipmentSearchRequest {
  query: string;
  category?: string;
}

export interface StripeCheckoutRequest {
  equipmentId: string;
  days: number;
}

export interface StripeConnectAccountRequest {
  displayName: string;
  contactEmail: string;
}

export interface StripeProductRequest {
  name: string;
  description: string;
  priceInCents: number;
  connectedAccountId: string;
  equipmentId?: string;
}

// Form Types
export interface EquipmentFormData {
  title: string;
  description: string;
  category: string;
  dailyRate: number;
  available?: boolean;
  image?: string | null;
  location?: string | null;
  specs?: string;
  hourMeter?: number | null;
}

export interface BookingFormData {
  equipmentId: string;
  startDate: Date;
  endDate: Date;
}

export interface AuthSession {
  user?: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role?: "USER" | "OWNER" | "ADMIN";
    stripeAccountId?: string | null;
  };
  expires: string;
}
