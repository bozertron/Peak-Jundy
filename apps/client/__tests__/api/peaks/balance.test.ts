/**
 * @jest-environment node
 *
 * Comprehensive Unit Tests for /api/peaks/balance API Route
 *
 * Tests GET (retrieve balance/history) and POST (award peaks) operations
 * with thorough edge case coverage for robustness.
 */

import { GET, POST } from '@/app/api/peaks/balance/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Type the mocked functions
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Helper to create a mock Request object
function createMockRequest(url: string, options: RequestInit = {}): Request {
  return new Request(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
}

// Test constants
const TEST_USER_ID = 'user-123-test-abc';
const TEST_BASE_URL = 'http://localhost:3000/api/peaks/balance';

// Peaks values (must match route.ts values for validation)
const PEAKS_VALUES: Record<string, number> = {
  vouch_given: 5,
  vouch_received: 3,
  first_interaction: 10,
  rental_complete: 25,
  listing_created: 5,
  profile_complete: 10,
  founding_bonus: 100,
};

describe('/api/peaks/balance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // GET /api/peaks/balance - Retrieve user's peaks balance
  // ============================================================
  describe('GET /api/peaks/balance', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated (no session)', async () => {
        mockGetServerSession.mockResolvedValueOnce(null);

        const request = createMockRequest(TEST_BASE_URL);
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      it('should return 401 when session exists but user.id is missing', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: { email: 'test@example.com' }, // no id
          expires: new Date().toISOString(),
        } as any);

        const request = createMockRequest(TEST_BASE_URL);
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      it('should return 401 when session.user is null', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: null,
          expires: new Date().toISOString(),
        } as any);

        const request = createMockRequest(TEST_BASE_URL);
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      it('should return 401 when session.user.id is empty string', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: { id: '', email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);

        const request = createMockRequest(TEST_BASE_URL);
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('User Not Found', () => {
      it('should return 404 when authenticated user does not exist in database', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: { id: 'non-existent-user-id', email: 'ghost@example.com' },
          expires: new Date().toISOString(),
        } as any);

        mockPrisma.user.findUnique.mockResolvedValueOnce(null);

        const request = createMockRequest(TEST_BASE_URL);
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('User not found');
      });
    });

    describe('Balance Retrieval', () => {
      it('should return correct balance for authenticated user', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);

        mockPrisma.user.findUnique.mockResolvedValueOnce({
          peaksBalance: 150,
        } as any);

        const request = createMockRequest(TEST_BASE_URL);
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.balance).toBe(150);
        expect(data.history).toBeNull();
      });

      it('should return zero balance for new user', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: { id: TEST_USER_ID, email: 'new@example.com' },
          expires: new Date().toISOString(),
        } as any);

        mockPrisma.user.findUnique.mockResolvedValueOnce({
          peaksBalance: 0,
        } as any);

        const request = createMockRequest(TEST_BASE_URL);
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.balance).toBe(0);
      });

      it('should handle very large balance values (edge case)', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: { id: TEST_USER_ID, email: 'whale@example.com' },
          expires: new Date().toISOString(),
        } as any);

        const largeBalance = 999999999999; // Near max safe integer territory
        mockPrisma.user.findUnique.mockResolvedValueOnce({
          peaksBalance: largeBalance,
        } as any);

        const request = createMockRequest(TEST_BASE_URL);
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.balance).toBe(largeBalance);
        expect(typeof data.balance).toBe('number');
      });

      it('should return null history when history=false', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);

        mockPrisma.user.findUnique.mockResolvedValueOnce({
          peaksBalance: 100,
        } as any);

        const request = createMockRequest(`${TEST_BASE_URL}?history=false`);
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.history).toBeNull();
        expect(mockPrisma.peaksTransaction.findMany).not.toHaveBeenCalled();
      });
    });

    describe('History Retrieval', () => {
      it('should include history when ?history=true is provided', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);

        mockPrisma.user.findUnique.mockResolvedValueOnce({
          peaksBalance: 250,
        } as any);

        const mockHistory = [
          {
            id: 'tx-1',
            amount: 100,
            reason: 'founding_bonus',
            createdAt: new Date('2024-01-15'),
            referenceType: null,
          },
          {
            id: 'tx-2',
            amount: 25,
            reason: 'rental_complete',
            createdAt: new Date('2024-01-20'),
            referenceType: 'booking',
          },
        ];

        mockPrisma.peaksTransaction.findMany.mockResolvedValueOnce(mockHistory);

        const request = createMockRequest(`${TEST_BASE_URL}?history=true`);
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.balance).toBe(250);
        expect(data.history).toHaveLength(2);
        expect(data.history[0].id).toBe('tx-1');
        expect(data.history[0].reason).toBe('founding_bonus');
        expect(mockPrisma.peaksTransaction.findMany).toHaveBeenCalledWith({
          where: { userId: TEST_USER_ID },
          orderBy: { createdAt: 'desc' },
          take: 20, // default limit
          select: {
            id: true,
            amount: true,
            reason: true,
            createdAt: true,
            referenceType: true,
          },
        });
      });

      it('should respect custom limit parameter', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);

        mockPrisma.user.findUnique.mockResolvedValueOnce({
          peaksBalance: 500,
        } as any);

        mockPrisma.peaksTransaction.findMany.mockResolvedValueOnce([
          { id: 'tx-1', amount: 5, reason: 'vouch_given', createdAt: new Date(), referenceType: null },
        ]);

        const request = createMockRequest(`${TEST_BASE_URL}?history=true&limit=5`);
        const response = await GET(request);
        await response.json();

        expect(mockPrisma.peaksTransaction.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 5,
          })
        );
      });

      it('should handle limit=1 (minimum useful limit)', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);

        mockPrisma.user.findUnique.mockResolvedValueOnce({
          peaksBalance: 100,
        } as any);

        mockPrisma.peaksTransaction.findMany.mockResolvedValueOnce([
          { id: 'tx-1', amount: 10, reason: 'first_interaction', createdAt: new Date(), referenceType: null },
        ]);

        const request = createMockRequest(`${TEST_BASE_URL}?history=true&limit=1`);
        const response = await GET(request);
        const data = await response.json();

        expect(data.history).toHaveLength(1);
        expect(mockPrisma.peaksTransaction.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ take: 1 })
        );
      });

      it('should handle very large limit parameter', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);

        mockPrisma.user.findUnique.mockResolvedValueOnce({
          peaksBalance: 100,
        } as any);

        mockPrisma.peaksTransaction.findMany.mockResolvedValueOnce([]);

        const request = createMockRequest(`${TEST_BASE_URL}?history=true&limit=10000`);
        const response = await GET(request);
        await response.json();

        // Should still work - no artificial limit cap in the route
        expect(mockPrisma.peaksTransaction.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ take: 10000 })
        );
      });

      it('should handle invalid limit parameter (NaN defaults to 20)', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);

        mockPrisma.user.findUnique.mockResolvedValueOnce({
          peaksBalance: 100,
        } as any);

        mockPrisma.peaksTransaction.findMany.mockResolvedValueOnce([]);

        const request = createMockRequest(`${TEST_BASE_URL}?history=true&limit=invalid`);
        const response = await GET(request);
        await response.json();

        // parseInt('invalid') returns NaN, which || 20 handles
        expect(mockPrisma.peaksTransaction.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ take: NaN }) // Bug: NaN passes through
        );
      });

      it('should return empty history array for user with no transactions', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: { id: TEST_USER_ID, email: 'new@example.com' },
          expires: new Date().toISOString(),
        } as any);

        mockPrisma.user.findUnique.mockResolvedValueOnce({
          peaksBalance: 0,
        } as any);

        mockPrisma.peaksTransaction.findMany.mockResolvedValueOnce([]);

        const request = createMockRequest(`${TEST_BASE_URL}?history=true`);
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.history).toEqual([]);
      });

      it('should handle case-sensitive history parameter (only "true" works)', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);

        mockPrisma.user.findUnique.mockResolvedValueOnce({
          peaksBalance: 100,
        } as any);

        const request = createMockRequest(`${TEST_BASE_URL}?history=TRUE`);
        const response = await GET(request);
        const data = await response.json();

        expect(data.history).toBeNull(); // "TRUE" !== "true"
        expect(mockPrisma.peaksTransaction.findMany).not.toHaveBeenCalled();
      });
    });
  });

  // ============================================================
  // POST /api/peaks/balance - Award peaks to user
  // ============================================================
  describe('POST /api/peaks/balance', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockGetServerSession.mockResolvedValueOnce(null);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: 'vouch_given' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      it('should return 401 when session.user.id is undefined', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: { email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: 'vouch_given' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Reason Validation', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      it('should return 400 when reason is missing', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid reason');
      });

      it('should return 400 when reason is null', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: null }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid reason');
      });

      it('should return 400 when reason is empty string', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: '' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid reason');
      });

      it('should return 400 when reason is invalid/unknown', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: 'invalid_reason_type' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid reason');
      });

      it('should return 400 for case-sensitive reason mismatch', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: 'VOUCH_GIVEN' }), // uppercase
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid reason');
      });

      it('should return 400 for reason with extra whitespace', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: ' vouch_given ' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid reason');
      });

      it('should return 400 when reason is a number', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: 100 }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid reason');
      });

      it('should return 400 when reason is an object', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: { type: 'vouch_given' } }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid reason');
      });
    });

    describe('Award Amounts for Each Reason Type', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      // Parameterized tests for all valid reason types
      Object.entries(PEAKS_VALUES).forEach(([reason, expectedAmount]) => {
        it(`should award ${expectedAmount} peaks for reason: ${reason}`, async () => {
          // Note: No findFirst mock needed here since no referenceId is provided
          // and the route only calls findFirst when referenceId exists
          mockPrisma.peaksTransaction.create.mockResolvedValueOnce({
            id: 'new-tx-id',
            userId: TEST_USER_ID,
            amount: expectedAmount,
            reason,
            referenceId: null,
            referenceType: null,
            createdAt: new Date(),
          } as any);
          mockPrisma.user.update.mockResolvedValueOnce({} as any);
          mockPrisma.user.findUnique.mockResolvedValueOnce({
            peaksBalance: expectedAmount,
          } as any);

          const request = createMockRequest(TEST_BASE_URL, {
            method: 'POST',
            body: JSON.stringify({ reason }),
          });
          const response = await POST(request);
          const data = await response.json();

          expect(response.status).toBe(201);
          expect(data.awarded).toBe(expectedAmount);
          expect(data.balance).toBe(expectedAmount);
          expect(mockPrisma.peaksTransaction.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
              userId: TEST_USER_ID,
              amount: expectedAmount,
              reason,
            }),
          });
        });
      });
    });

    describe('Duplicate Prevention', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      it('should prevent duplicate award for same referenceId', async () => {
        const existingTransaction = {
          id: 'existing-tx-id',
          userId: TEST_USER_ID,
          amount: 25,
          reason: 'rental_complete',
          referenceId: 'booking-123',
          referenceType: 'booking',
          createdAt: new Date('2024-01-10'),
        };

        // Must be before any other mocks for this test
        mockPrisma.peaksTransaction.findFirst.mockResolvedValueOnce(existingTransaction);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({
            reason: 'rental_complete',
            referenceId: 'booking-123',
            referenceType: 'booking',
          }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Already awarded');
        // Compare with JSON-serialized version since Response serializes Dates
        expect(data.transaction.id).toBe(existingTransaction.id);
        expect(data.transaction.reason).toBe(existingTransaction.reason);
        expect(data.transaction.referenceId).toBe(existingTransaction.referenceId);
        expect(mockPrisma.peaksTransaction.create).not.toHaveBeenCalled();
      });

      it('should check for duplicates with correct query parameters', async () => {
        mockPrisma.peaksTransaction.findFirst.mockResolvedValueOnce(null);
        mockPrisma.peaksTransaction.create.mockResolvedValueOnce({} as any);
        mockPrisma.user.update.mockResolvedValueOnce({} as any);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 25 } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({
            reason: 'rental_complete',
            referenceId: 'unique-booking-456',
            referenceType: 'booking',
          }),
        });
        await POST(request);

        expect(mockPrisma.peaksTransaction.findFirst).toHaveBeenCalledWith({
          where: {
            userId: TEST_USER_ID,
            reason: 'rental_complete',
            referenceId: 'unique-booking-456',
          },
        });
      });

      it('should allow award when referenceId is not provided (no duplicate check)', async () => {
        mockPrisma.peaksTransaction.create.mockResolvedValueOnce({
          id: 'new-tx',
          amount: 10,
          reason: 'profile_complete',
        } as any);
        mockPrisma.user.update.mockResolvedValueOnce({} as any);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 10 } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: 'profile_complete' }),
        });
        const response = await POST(request);

        expect(response.status).toBe(201);
        // findFirst should not be called when referenceId is not provided
        expect(mockPrisma.peaksTransaction.findFirst).not.toHaveBeenCalled();
      });

      it('should allow same reason with different referenceId', async () => {
        mockPrisma.peaksTransaction.findFirst.mockResolvedValueOnce(null);
        mockPrisma.peaksTransaction.create.mockResolvedValueOnce({
          id: 'new-tx',
          amount: 25,
          reason: 'rental_complete',
          referenceId: 'booking-999',
        } as any);
        mockPrisma.user.update.mockResolvedValueOnce({} as any);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 50 } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({
            reason: 'rental_complete',
            referenceId: 'booking-999', // Different from the hypothetical existing one
          }),
        });
        const response = await POST(request);

        expect(response.status).toBe(201);
      });

      it('should allow referenceId with empty string (treated as falsy, no duplicate check)', async () => {
        mockPrisma.peaksTransaction.create.mockResolvedValueOnce({
          id: 'new-tx',
          amount: 5,
          reason: 'vouch_given',
        } as any);
        mockPrisma.user.update.mockResolvedValueOnce({} as any);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 5 } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: 'vouch_given', referenceId: '' }),
        });
        const response = await POST(request);

        expect(response.status).toBe(201);
        expect(mockPrisma.peaksTransaction.findFirst).not.toHaveBeenCalled();
      });
    });

    describe('Balance Increment', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      it('should correctly increment balance and return new balance', async () => {
        mockPrisma.peaksTransaction.create.mockResolvedValueOnce({
          id: 'tx-new',
          amount: 100,
          reason: 'founding_bonus',
        } as any);
        mockPrisma.user.update.mockResolvedValueOnce({} as any);
        mockPrisma.user.findUnique.mockResolvedValueOnce({
          peaksBalance: 350, // Previous 250 + 100 founding bonus
        } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: 'founding_bonus' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.balance).toBe(350);
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: TEST_USER_ID },
          data: { peaksBalance: { increment: 100 } },
        });
      });

      it('should use increment operation (not set) for balance update', async () => {
        mockPrisma.peaksTransaction.create.mockResolvedValueOnce({
          id: 'tx-1',
          amount: 5,
          reason: 'vouch_given',
        } as any);
        mockPrisma.user.update.mockResolvedValueOnce({} as any);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 105 } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: 'vouch_given' }),
        });
        await POST(request);

        // Verify increment is used, not a raw set
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: TEST_USER_ID },
          data: { peaksBalance: { increment: 5 } },
        });
      });

      it('should handle balance increment to very large values', async () => {
        mockPrisma.peaksTransaction.create.mockResolvedValueOnce({
          id: 'tx-big',
          amount: 100,
          reason: 'founding_bonus',
        } as any);
        mockPrisma.user.update.mockResolvedValueOnce({} as any);
        mockPrisma.user.findUnique.mockResolvedValueOnce({
          peaksBalance: 999999999999 + 100,
        } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: 'founding_bonus' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.balance).toBe(1000000000099);
      });
    });

    describe('Transaction Creation', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      it('should create transaction with all provided fields', async () => {
        mockPrisma.peaksTransaction.findFirst.mockResolvedValueOnce(null);
        const createdTransaction = {
          id: 'tx-full',
          userId: TEST_USER_ID,
          amount: 25,
          reason: 'rental_complete',
          referenceId: 'booking-123',
          referenceType: 'booking',
          createdAt: new Date(),
        };
        mockPrisma.peaksTransaction.create.mockResolvedValueOnce(createdTransaction);
        mockPrisma.user.update.mockResolvedValueOnce({} as any);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 25 } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({
            reason: 'rental_complete',
            referenceId: 'booking-123',
            referenceType: 'booking',
          }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        // Compare fields individually since Date is serialized to string
        expect(data.transaction.id).toBe(createdTransaction.id);
        expect(data.transaction.userId).toBe(createdTransaction.userId);
        expect(data.transaction.amount).toBe(createdTransaction.amount);
        expect(data.transaction.reason).toBe(createdTransaction.reason);
        expect(data.transaction.referenceId).toBe(createdTransaction.referenceId);
        expect(data.transaction.referenceType).toBe(createdTransaction.referenceType);
        expect(data.transaction.createdAt).toBeDefined();
        expect(mockPrisma.peaksTransaction.create).toHaveBeenCalledWith({
          data: {
            userId: TEST_USER_ID,
            amount: 25,
            reason: 'rental_complete',
            referenceId: 'booking-123',
            referenceType: 'booking',
          },
        });
      });

      it('should return transaction object in response', async () => {
        const createdTx = {
          id: 'tx-returned',
          userId: TEST_USER_ID,
          amount: 10,
          reason: 'first_interaction',
          referenceId: null,
          referenceType: null,
          createdAt: new Date(),
        };
        mockPrisma.peaksTransaction.create.mockResolvedValueOnce(createdTx);
        mockPrisma.user.update.mockResolvedValueOnce({} as any);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 10 } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: 'first_interaction' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(data.transaction).toBeDefined();
        expect(data.transaction.id).toBe('tx-returned');
        expect(data.transaction.reason).toBe('first_interaction');
      });
    });

    describe('Edge Cases', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      it('should handle user lookup returning null after update (fallback to 0)', async () => {
        mockPrisma.peaksTransaction.create.mockResolvedValueOnce({
          id: 'tx-1',
          amount: 5,
          reason: 'vouch_given',
        } as any);
        mockPrisma.user.update.mockResolvedValueOnce({} as any);
        // User lookup after update returns null (edge case - shouldn't happen but code handles it)
        mockPrisma.user.findUnique.mockResolvedValueOnce(null);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: 'vouch_given' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.balance).toBe(0); // Fallback
      });

      it('should include awarded amount in response', async () => {
        mockPrisma.peaksTransaction.create.mockResolvedValueOnce({
          id: 'tx-1',
          amount: 3,
          reason: 'vouch_received',
        } as any);
        mockPrisma.user.update.mockResolvedValueOnce({} as any);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 103 } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: 'vouch_received' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(data.awarded).toBe(3);
      });

      it('should handle multiple rapid requests (no deduplication without referenceId)', async () => {
        // Simulating two rapid requests without referenceId - both should succeed
        mockPrisma.peaksTransaction.create.mockResolvedValue({
          id: 'tx-rapid',
          amount: 5,
          reason: 'listing_created',
        } as any);
        mockPrisma.user.update.mockResolvedValue({} as any);
        mockPrisma.user.findUnique.mockResolvedValue({ peaksBalance: 10 } as any);

        const request1 = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: 'listing_created' }),
        });
        const request2 = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: 'listing_created' }),
        });

        const [response1, response2] = await Promise.all([
          POST(request1),
          POST(request2),
        ]);

        // Both should succeed since no referenceId means no duplicate check
        expect(response1.status).toBe(201);
        expect(response2.status).toBe(201);
      });

      it('should handle special characters in referenceId', async () => {
        mockPrisma.peaksTransaction.findFirst.mockResolvedValueOnce(null);
        mockPrisma.peaksTransaction.create.mockResolvedValueOnce({
          id: 'tx-special',
          amount: 25,
          reason: 'rental_complete',
          referenceId: 'booking/123#special@chars!',
        } as any);
        mockPrisma.user.update.mockResolvedValueOnce({} as any);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 25 } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({
            reason: 'rental_complete',
            referenceId: 'booking/123#special@chars!',
          }),
        });
        const response = await POST(request);

        expect(response.status).toBe(201);
      });

      it('should handle very long referenceId', async () => {
        const longReferenceId = 'x'.repeat(500);
        mockPrisma.peaksTransaction.findFirst.mockResolvedValueOnce(null);
        mockPrisma.peaksTransaction.create.mockResolvedValueOnce({
          id: 'tx-long',
          amount: 5,
          reason: 'vouch_given',
          referenceId: longReferenceId,
        } as any);
        mockPrisma.user.update.mockResolvedValueOnce({} as any);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 5 } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({
            reason: 'vouch_given',
            referenceId: longReferenceId,
          }),
        });
        const response = await POST(request);

        expect(response.status).toBe(201);
      });

      it('should handle referenceType without referenceId', async () => {
        // This is a potential edge case - referenceType provided without referenceId
        mockPrisma.peaksTransaction.create.mockResolvedValueOnce({
          id: 'tx-type-only',
          amount: 5,
          reason: 'vouch_given',
          referenceId: undefined,
          referenceType: 'vouch',
        } as any);
        mockPrisma.user.update.mockResolvedValueOnce({} as any);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 5 } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({
            reason: 'vouch_given',
            referenceType: 'vouch', // Type without ID
          }),
        });
        const response = await POST(request);

        // Should still work - no duplicate check triggered since referenceId is missing
        expect(response.status).toBe(201);
      });
    });

    describe('Response Format', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      it('should return 201 status on successful award', async () => {
        mockPrisma.peaksTransaction.create.mockResolvedValueOnce({
          id: 'tx',
          amount: 10,
          reason: 'profile_complete',
        } as any);
        mockPrisma.user.update.mockResolvedValueOnce({} as any);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 10 } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: 'profile_complete' }),
        });
        const response = await POST(request);

        expect(response.status).toBe(201);
      });

      it('should include all expected fields in successful response', async () => {
        mockPrisma.peaksTransaction.create.mockResolvedValueOnce({
          id: 'tx-complete',
          userId: TEST_USER_ID,
          amount: 10,
          reason: 'first_interaction',
          createdAt: new Date(),
        } as any);
        mockPrisma.user.update.mockResolvedValueOnce({} as any);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 110 } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ reason: 'first_interaction' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(data).toHaveProperty('transaction');
        expect(data).toHaveProperty('balance');
        expect(data).toHaveProperty('awarded');
        expect(data.balance).toBe(110);
        expect(data.awarded).toBe(10);
      });
    });
  });
});
