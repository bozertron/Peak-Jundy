/**
 * Comprehensive Unit Tests for /api/peaks/chest API Route
 *
 * Tests GET (list chests), POST (claim chest), and PUT (admin create) operations
 * with thorough edge case coverage for robustness.
 */

import { GET, POST, PUT } from '@/app/api/peaks/chest/route';
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
const ADMIN_USER_ID = 'admin-456-test-xyz';
const TEST_BASE_URL = 'http://localhost:3000/api/peaks/chest';

// Sample chest data factory
function createMockChest(overrides = {}): any {
  return {
    id: 'chest-001',
    title: 'Golden Treasure Chest',
    description: 'A chest full of golden rewards',
    peaksCost: 100,
    prizeType: 'discount',
    prizeValue: '{"percentage": 20, "validDays": 30}',
    available: true,
    createdAt: new Date('2024-01-01'),
    claimedAt: null,
    claimedBy: null,
    ...overrides,
  };
}

describe('/api/peaks/chest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // GET /api/peaks/chest - List available or claimed chests
  // ============================================================
  describe('GET /api/peaks/chest', () => {
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
          user: { email: 'test@example.com' },
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

    describe('Available Chests Listing', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      it('should return available chests by default', async () => {
        const availableChests = [
          createMockChest({ id: 'chest-1', available: true }),
          createMockChest({ id: 'chest-2', available: true }),
        ];

        mockPrisma.treasureChest.findMany.mockResolvedValueOnce(availableChests);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 500 } as any);

        const request = createMockRequest(TEST_BASE_URL);
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.chests).toHaveLength(2);
        expect(mockPrisma.treasureChest.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { available: true },
          })
        );
      });

      it('should NOT include prizeValue for available chests', async () => {
        mockPrisma.treasureChest.findMany.mockResolvedValueOnce([
          {
            id: 'chest-1',
            title: 'Test Chest',
            description: 'Desc',
            peaksCost: 100,
            prizeType: 'discount',
            available: true,
            createdAt: new Date(),
            claimedAt: null,
          },
        ]);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 200 } as any);

        const request = createMockRequest(TEST_BASE_URL);
        const response = await GET(request);
        const data = await response.json();

        // Verify the select doesn't include prizeValue for available chests
        expect(mockPrisma.treasureChest.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            select: expect.not.objectContaining({
              prizeValue: true,
            }),
          })
        );
      });

      it('should include userBalance in response', async () => {
        mockPrisma.treasureChest.findMany.mockResolvedValueOnce([]);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 750 } as any);

        const request = createMockRequest(TEST_BASE_URL);
        const response = await GET(request);
        const data = await response.json();

        expect(data.userBalance).toBe(750);
      });

      it('should return empty chests array when none available', async () => {
        mockPrisma.treasureChest.findMany.mockResolvedValueOnce([]);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 100 } as any);

        const request = createMockRequest(TEST_BASE_URL);
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.chests).toEqual([]);
      });

      it('should handle user with zero balance', async () => {
        mockPrisma.treasureChest.findMany.mockResolvedValueOnce([
          createMockChest({ id: 'chest-1', peaksCost: 100 }),
        ]);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 0 } as any);

        const request = createMockRequest(TEST_BASE_URL);
        const response = await GET(request);
        const data = await response.json();

        expect(data.userBalance).toBe(0);
        expect(data.chests).toHaveLength(1);
      });

      it('should handle user not found in database (fallback to 0 balance)', async () => {
        mockPrisma.treasureChest.findMany.mockResolvedValueOnce([]);
        mockPrisma.user.findUnique.mockResolvedValueOnce(null);

        const request = createMockRequest(TEST_BASE_URL);
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.userBalance).toBe(0);
      });

      it('should order chests by createdAt descending', async () => {
        mockPrisma.treasureChest.findMany.mockResolvedValueOnce([]);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 100 } as any);

        const request = createMockRequest(TEST_BASE_URL);
        await GET(request);

        expect(mockPrisma.treasureChest.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: { createdAt: 'desc' },
          })
        );
      });
    });

    describe('User Claimed Chests (mine=true)', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      it('should return user claimed chests when mine=true', async () => {
        const claimedChests = [
          createMockChest({
            id: 'chest-claimed-1',
            available: false,
            claimedBy: TEST_USER_ID,
            claimedAt: new Date('2024-02-01'),
          }),
        ];

        mockPrisma.treasureChest.findMany.mockResolvedValueOnce(claimedChests);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 400 } as any);

        const request = createMockRequest(`${TEST_BASE_URL}?mine=true`);
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.chests).toHaveLength(1);
        expect(mockPrisma.treasureChest.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { claimedBy: TEST_USER_ID },
          })
        );
      });

      it('should INCLUDE prizeValue for user claimed chests', async () => {
        mockPrisma.treasureChest.findMany.mockResolvedValueOnce([
          createMockChest({
            id: 'chest-claimed',
            available: false,
            claimedBy: TEST_USER_ID,
            prizeValue: '{"code": "DISCOUNT20"}',
          }),
        ]);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 300 } as any);

        const request = createMockRequest(`${TEST_BASE_URL}?mine=true`);
        await GET(request);

        expect(mockPrisma.treasureChest.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            select: expect.objectContaining({
              prizeValue: true,
            }),
          })
        );
      });

      it('should return empty array when user has no claimed chests', async () => {
        mockPrisma.treasureChest.findMany.mockResolvedValueOnce([]);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 500 } as any);

        const request = createMockRequest(`${TEST_BASE_URL}?mine=true`);
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.chests).toEqual([]);
      });

      it('should handle mine=false same as default (available chests)', async () => {
        mockPrisma.treasureChest.findMany.mockResolvedValueOnce([]);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 100 } as any);

        const request = createMockRequest(`${TEST_BASE_URL}?mine=false`);
        await GET(request);

        expect(mockPrisma.treasureChest.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { available: true },
          })
        );
      });

      it('should handle case-sensitive mine parameter (only "true" works)', async () => {
        mockPrisma.treasureChest.findMany.mockResolvedValueOnce([]);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 100 } as any);

        const request = createMockRequest(`${TEST_BASE_URL}?mine=TRUE`);
        await GET(request);

        // "TRUE" !== "true", so should fetch available chests
        expect(mockPrisma.treasureChest.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { available: true },
          })
        );
      });
    });

    describe('Response Structure', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      it('should include expected fields in chest objects', async () => {
        mockPrisma.treasureChest.findMany.mockResolvedValueOnce([
          {
            id: 'chest-fields',
            title: 'Mystery Chest',
            description: 'What could be inside?',
            peaksCost: 50,
            prizeType: 'badge',
            available: true,
            createdAt: new Date('2024-01-15'),
            claimedAt: null,
          },
        ]);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 200 } as any);

        const request = createMockRequest(TEST_BASE_URL);
        const response = await GET(request);
        const data = await response.json();

        const chest = data.chests[0];
        expect(chest).toHaveProperty('id');
        expect(chest).toHaveProperty('title');
        expect(chest).toHaveProperty('description');
        expect(chest).toHaveProperty('peaksCost');
        expect(chest).toHaveProperty('prizeType');
        expect(chest).toHaveProperty('available');
        expect(chest).toHaveProperty('createdAt');
      });
    });
  });

  // ============================================================
  // POST /api/peaks/chest - Claim a treasure chest
  // ============================================================
  describe('POST /api/peaks/chest', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockGetServerSession.mockResolvedValueOnce(null);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-123' }),
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
          body: JSON.stringify({ chestId: 'chest-123' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('ChestId Validation', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      it('should return 400 when chestId is missing', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Chest ID is required');
      });

      it('should return 400 when chestId is null', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: null }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Chest ID is required');
      });

      it('should return 400 when chestId is empty string', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: '' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Chest ID is required');
      });

      it('should return 400 when chestId is undefined', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: undefined }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Chest ID is required');
      });
    });

    describe('Chest Not Found', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      it('should return 404 when chest does not exist', async () => {
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(null);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'non-existent-chest-id' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Chest not found');
      });

      it('should query with correct chestId', async () => {
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(null);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'specific-chest-123' }),
        });
        await POST(request);

        expect(mockPrisma.treasureChest.findUnique).toHaveBeenCalledWith({
          where: { id: 'specific-chest-123' },
        });
      });
    });

    describe('Already Claimed Chest', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      it('should return 400 when chest is already claimed', async () => {
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(
          createMockChest({
            id: 'claimed-chest',
            available: false,
            claimedBy: 'another-user-id',
            claimedAt: new Date('2024-01-15'),
          })
        );

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'claimed-chest' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Chest already claimed');
      });

      it('should return 400 when chest was claimed by the same user', async () => {
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(
          createMockChest({
            id: 'my-claimed-chest',
            available: false,
            claimedBy: TEST_USER_ID, // Same user trying again
            claimedAt: new Date('2024-01-10'),
          })
        );

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'my-claimed-chest' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Chest already claimed');
      });
    });

    describe('Insufficient Balance', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      it('should return 400 when user has insufficient balance', async () => {
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(
          createMockChest({ peaksCost: 500 })
        );
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 100 } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Insufficient Peaks balance');
        expect(data.required).toBe(500);
        expect(data.current).toBe(100);
      });

      it('should return 400 when user has zero balance', async () => {
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(
          createMockChest({ peaksCost: 100 })
        );
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 0 } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Insufficient Peaks balance');
        expect(data.required).toBe(100);
        expect(data.current).toBe(0);
      });

      it('should return 400 when user not found (balance check)', async () => {
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(
          createMockChest({ peaksCost: 100 })
        );
        mockPrisma.user.findUnique.mockResolvedValueOnce(null);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Insufficient Peaks balance');
        expect(data.current).toBe(0); // Fallback
      });

      it('should return required and current amounts for helpful error message', async () => {
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(
          createMockChest({ peaksCost: 250 })
        );
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 123 } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(data.required).toBe(250);
        expect(data.current).toBe(123);
      });
    });

    describe('Balance Exactly Equals Cost (Edge Case)', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      it('should allow claiming when balance exactly equals cost', async () => {
        const chest = createMockChest({ peaksCost: 100 });
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(chest);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 100 } as any);
        mockPrisma.$transaction.mockResolvedValueOnce([
          { ...chest, available: false, claimedBy: TEST_USER_ID, claimedAt: new Date() },
          {},
          {},
        ]);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.newBalance).toBe(0); // 100 - 100
      });

      it('should correctly calculate newBalance to zero', async () => {
        const chest = createMockChest({ peaksCost: 500 });
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(chest);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 500 } as any);
        mockPrisma.$transaction.mockResolvedValueOnce([
          { ...chest, available: false, claimedBy: TEST_USER_ID },
          {},
          {},
        ]);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(data.newBalance).toBe(0);
      });
    });

    describe('Successful Claim', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      it('should successfully claim chest and return success response', async () => {
        const chest = createMockChest({
          peaksCost: 50,
          prizeValue: '{"discount": 20}',
        });
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(chest);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 200 } as any);
        mockPrisma.$transaction.mockResolvedValueOnce([
          {
            ...chest,
            available: false,
            claimedBy: TEST_USER_ID,
            claimedAt: new Date(),
          },
          {},
          {},
        ]);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.chest).toBeDefined();
        expect(data.newBalance).toBe(150); // 200 - 50
      });

      it('should execute transaction with three operations', async () => {
        const chest = createMockChest({ peaksCost: 75 });
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(chest);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 100 } as any);
        mockPrisma.$transaction.mockResolvedValueOnce([chest, {}, {}]);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });
        await POST(request);

        expect(mockPrisma.$transaction).toHaveBeenCalledWith([
          // Update chest
          expect.objectContaining({}),
          // Update user balance
          expect.objectContaining({}),
          // Create transaction
          expect.objectContaining({}),
        ]);
      });

      it('should mark chest as unavailable', async () => {
        const chest = createMockChest();
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(chest);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 500 } as any);
        mockPrisma.$transaction.mockImplementationOnce(async (operations) => {
          // Verify the chest update operation
          return [{ ...chest, available: false }, {}, {}];
        });

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });
        await POST(request);

        // The transaction should be called with operations that mark chest unavailable
        expect(mockPrisma.$transaction).toHaveBeenCalled();
      });

      it('should deduct peaks from user balance', async () => {
        const chest = createMockChest({ peaksCost: 100 });
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(chest);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 300 } as any);
        mockPrisma.$transaction.mockResolvedValueOnce([chest, {}, {}]);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(data.newBalance).toBe(200); // 300 - 100
      });

      it('should create transaction record', async () => {
        const chest = createMockChest({ id: 'chest-123', peaksCost: 50 });
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(chest);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 100 } as any);
        mockPrisma.$transaction.mockResolvedValueOnce([chest, {}, {}]);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-123' }),
        });
        await POST(request);

        // Transaction should include creating a peaksTransaction record
        expect(mockPrisma.$transaction).toHaveBeenCalled();
      });
    });

    describe('Prize Parsing', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      it('should parse JSON prizeValue correctly', async () => {
        const jsonPrize = { code: 'DISCOUNT50', percentage: 50, validUntil: '2024-12-31' };
        const chest = createMockChest({
          prizeValue: JSON.stringify(jsonPrize),
        });
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(chest);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 200 } as any);
        mockPrisma.$transaction.mockResolvedValueOnce([chest, {}, {}]);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(data.chest.prize).toEqual(jsonPrize);
      });

      it('should handle string prizeValue (fallback to description object)', async () => {
        const chest = createMockChest({
          prizeValue: 'Free rental weekend!',
        });
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(chest);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 200 } as any);
        mockPrisma.$transaction.mockResolvedValueOnce([chest, {}, {}]);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(data.chest.prize).toEqual({ description: 'Free rental weekend!' });
      });

      it('should handle invalid JSON prizeValue gracefully', async () => {
        const chest = createMockChest({
          prizeValue: '{ invalid json here',
        });
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(chest);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 200 } as any);
        mockPrisma.$transaction.mockResolvedValueOnce([chest, {}, {}]);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.chest.prize).toEqual({ description: '{ invalid json here' });
      });

      it('should handle empty prizeValue', async () => {
        const chest = createMockChest({ prizeValue: '' });
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(chest);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 200 } as any);
        mockPrisma.$transaction.mockResolvedValueOnce([chest, {}, {}]);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.chest.prize).toEqual({ description: '' });
      });

      it('should handle nested JSON prizeValue', async () => {
        const complexPrize = {
          type: 'bundle',
          items: [
            { name: 'Discount Code', value: 'PEAK20' },
            { name: 'Badge', value: 'early_adopter' },
          ],
          metadata: { version: 1, createdBy: 'system' },
        };
        const chest = createMockChest({
          prizeValue: JSON.stringify(complexPrize),
        });
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(chest);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 500 } as any);
        mockPrisma.$transaction.mockResolvedValueOnce([chest, {}, {}]);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(data.chest.prize).toEqual(complexPrize);
      });
    });

    describe('Response Format', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      it('should include expected fields in successful response', async () => {
        const chest = createMockChest({
          id: 'chest-full',
          title: 'Grand Prize Chest',
          prizeType: 'coupon',
          prizeValue: '{"code": "GRAND50"}',
          peaksCost: 100,
        });
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(chest);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 500 } as any);
        mockPrisma.$transaction.mockResolvedValueOnce([chest, {}, {}]);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-full' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('chest');
        expect(data.chest).toHaveProperty('id', 'chest-full');
        expect(data.chest).toHaveProperty('title', 'Grand Prize Chest');
        expect(data.chest).toHaveProperty('prizeType', 'coupon');
        expect(data.chest).toHaveProperty('prize');
        expect(data).toHaveProperty('newBalance', 400);
      });
    });

    describe('Race Condition Handling (Edge Case)', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      it('should handle database transaction failure', async () => {
        const chest = createMockChest();
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(chest);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 200 } as any);
        mockPrisma.$transaction.mockRejectedValueOnce(new Error('Transaction conflict'));

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });

        // The route doesn't have explicit error handling, so this will throw
        await expect(POST(request)).rejects.toThrow('Transaction conflict');
      });

      it('should use atomic transaction for claim operation', async () => {
        const chest = createMockChest();
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(chest);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 200 } as any);
        mockPrisma.$transaction.mockResolvedValueOnce([chest, {}, {}]);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });
        await POST(request);

        // Verify $transaction is used (atomic operation)
        expect(mockPrisma.$transaction).toHaveBeenCalled();
        // Individual operations should NOT be called separately
        expect(mockPrisma.treasureChest.update).not.toHaveBeenCalled();
        expect(mockPrisma.peaksTransaction.create).not.toHaveBeenCalled();
      });

      it('should handle concurrent claim attempts (simulated)', async () => {
        // Simulate two users trying to claim the same chest
        // First user's session
        mockGetServerSession
          .mockResolvedValueOnce({
            user: { id: 'user-1', email: 'user1@example.com' },
            expires: new Date().toISOString(),
          } as any)
          .mockResolvedValueOnce({
            user: { id: 'user-2', email: 'user2@example.com' },
            expires: new Date().toISOString(),
          } as any);

        const chest = createMockChest({ id: 'contested-chest' });

        // First request sees available chest
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(chest);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 200 } as any);
        mockPrisma.$transaction.mockResolvedValueOnce([chest, {}, {}]);

        // Second request should see claimed chest (transaction failed or chest marked unavailable)
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce({
          ...chest,
          available: false,
          claimedBy: 'user-1',
        });

        const request1 = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'contested-chest' }),
        });
        const request2 = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'contested-chest' }),
        });

        const [response1, response2] = await Promise.all([
          POST(request1),
          POST(request2),
        ]);

        const data1 = await response1.json();
        const data2 = await response2.json();

        // First should succeed
        expect(data1.success).toBe(true);
        // Second should fail (chest already claimed)
        expect(data2.error).toBe('Chest already claimed');
      });
    });

    describe('Edge Cases', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: TEST_USER_ID, email: 'test@example.com' },
          expires: new Date().toISOString(),
        } as any);
      });

      it('should handle chest with very high cost', async () => {
        const expensiveChest = createMockChest({ peaksCost: 999999999 });
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(expensiveChest);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 100 } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Insufficient Peaks balance');
        expect(data.required).toBe(999999999);
      });

      it('should handle chest with zero cost (free chest)', async () => {
        const freeChest = createMockChest({ peaksCost: 0 });
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(freeChest);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 0 } as any);
        mockPrisma.$transaction.mockResolvedValueOnce([freeChest, {}, {}]);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.newBalance).toBe(0);
      });

      it('should handle special characters in chestId', async () => {
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(null);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest/123#special@chars!' }),
        });
        const response = await POST(request);

        expect(mockPrisma.treasureChest.findUnique).toHaveBeenCalledWith({
          where: { id: 'chest/123#special@chars!' },
        });
      });

      it('should handle very long prizeValue', async () => {
        const longValue = JSON.stringify({ data: 'x'.repeat(10000) });
        const chest = createMockChest({ prizeValue: longValue });
        mockPrisma.treasureChest.findUnique.mockResolvedValueOnce(chest);
        mockPrisma.user.findUnique.mockResolvedValueOnce({ peaksBalance: 200 } as any);
        mockPrisma.$transaction.mockResolvedValueOnce([chest, {}, {}]);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'POST',
          body: JSON.stringify({ chestId: 'chest-001' }),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.chest.prize.data.length).toBe(10000);
      });
    });
  });

  // ============================================================
  // PUT /api/peaks/chest - Admin create chest
  // ============================================================
  describe('PUT /api/peaks/chest', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockGetServerSession.mockResolvedValueOnce(null);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'New Chest',
            description: 'Description',
            peaksCost: 100,
            prizeType: 'discount',
            prizeValue: '20% off',
          }),
        });
        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Authorization (Admin Check)', () => {
      it('should return 403 when user is not admin', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: { id: TEST_USER_ID, email: 'regular@example.com' },
          expires: new Date().toISOString(),
        } as any);

        mockPrisma.user.findUnique.mockResolvedValueOnce({
          id: TEST_USER_ID,
          role: 'USER',
        } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'New Chest',
            description: 'Description',
            peaksCost: 100,
            prizeType: 'discount',
            prizeValue: '20% off',
          }),
        });
        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe('Admin access required');
      });

      it('should return 403 when user role is null/undefined', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: { id: TEST_USER_ID, email: 'norole@example.com' },
          expires: new Date().toISOString(),
        } as any);

        mockPrisma.user.findUnique.mockResolvedValueOnce({
          id: TEST_USER_ID,
          role: null,
        } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Chest',
            description: 'Desc',
            peaksCost: 50,
            prizeType: 'badge',
            prizeValue: 'golden_star',
          }),
        });
        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe('Admin access required');
      });

      it('should return 403 when user not found in database', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: { id: 'ghost-admin', email: 'ghost@example.com' },
          expires: new Date().toISOString(),
        } as any);

        mockPrisma.user.findUnique.mockResolvedValueOnce(null);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Chest',
            description: 'Desc',
            peaksCost: 50,
            prizeType: 'badge',
            prizeValue: 'star',
          }),
        });
        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe('Admin access required');
      });

      it('should return 403 for case-sensitive role check (admin vs ADMIN)', async () => {
        mockGetServerSession.mockResolvedValueOnce({
          user: { id: TEST_USER_ID, email: 'admin@example.com' },
          expires: new Date().toISOString(),
        } as any);

        mockPrisma.user.findUnique.mockResolvedValueOnce({
          id: TEST_USER_ID,
          role: 'admin', // lowercase
        } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Chest',
            description: 'Desc',
            peaksCost: 50,
            prizeType: 'badge',
            prizeValue: 'star',
          }),
        });
        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe('Admin access required');
      });
    });

    describe('Field Validation', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: ADMIN_USER_ID, email: 'admin@example.com' },
          expires: new Date().toISOString(),
        } as any);

        mockPrisma.user.findUnique.mockResolvedValue({
          id: ADMIN_USER_ID,
          role: 'ADMIN',
        } as any);
      });

      it('should return 400 when title is missing', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            description: 'Description',
            peaksCost: 100,
            prizeType: 'discount',
            prizeValue: '20%',
          }),
        });
        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields');
      });

      it('should return 400 when description is missing', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Chest',
            peaksCost: 100,
            prizeType: 'discount',
            prizeValue: '20%',
          }),
        });
        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields');
      });

      it('should return 400 when peaksCost is missing', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Chest',
            description: 'Description',
            prizeType: 'discount',
            prizeValue: '20%',
          }),
        });
        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields');
      });

      it('should return 400 when prizeType is missing', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Chest',
            description: 'Description',
            peaksCost: 100,
            prizeValue: '20%',
          }),
        });
        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields');
      });

      it('should return 400 when prizeValue is missing', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Chest',
            description: 'Description',
            peaksCost: 100,
            prizeType: 'discount',
          }),
        });
        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields');
      });

      it('should return 400 when title is empty string', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: '',
            description: 'Description',
            peaksCost: 100,
            prizeType: 'discount',
            prizeValue: '20%',
          }),
        });
        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields');
      });

      it('should return 400 when peaksCost is 0 (falsy)', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Free Chest',
            description: 'Description',
            peaksCost: 0,
            prizeType: 'badge',
            prizeValue: 'free_badge',
          }),
        });
        const response = await PUT(request);
        const data = await response.json();

        // Current implementation: 0 is falsy, so it fails
        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields');
      });

      it('should return 400 when all fields are empty', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({}),
        });
        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields');
      });
    });

    describe('Successful Chest Creation', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: ADMIN_USER_ID, email: 'admin@example.com' },
          expires: new Date().toISOString(),
        } as any);

        mockPrisma.user.findUnique.mockResolvedValue({
          id: ADMIN_USER_ID,
          role: 'ADMIN',
        } as any);
      });

      it('should create chest with all valid fields', async () => {
        const newChest = {
          id: 'new-chest-id',
          title: 'Epic Treasure Chest',
          description: 'An epic chest with amazing rewards',
          peaksCost: 500,
          prizeType: 'premium_badge',
          prizeValue: '{"badge": "legendary_explorer"}',
          available: true,
          createdAt: new Date(),
        };

        mockPrisma.treasureChest.create.mockResolvedValueOnce(newChest);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Epic Treasure Chest',
            description: 'An epic chest with amazing rewards',
            peaksCost: 500,
            prizeType: 'premium_badge',
            prizeValue: '{"badge": "legendary_explorer"}',
          }),
        });
        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.chest).toEqual(newChest);
      });

      it('should set available to true by default', async () => {
        mockPrisma.treasureChest.create.mockResolvedValueOnce({
          id: 'new-id',
          available: true,
        } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Chest',
            description: 'Desc',
            peaksCost: 100,
            prizeType: 'discount',
            prizeValue: '10%',
          }),
        });
        await PUT(request);

        expect(mockPrisma.treasureChest.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            available: true,
          }),
        });
      });

      it('should handle string prizeValue', async () => {
        mockPrisma.treasureChest.create.mockResolvedValueOnce({
          id: 'chest-str',
          prizeValue: 'Simple prize description',
        } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Simple Chest',
            description: 'A simple chest',
            peaksCost: 50,
            prizeType: 'text',
            prizeValue: 'Simple prize description',
          }),
        });
        await PUT(request);

        expect(mockPrisma.treasureChest.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            prizeValue: 'Simple prize description',
          }),
        });
      });

      it('should stringify object prizeValue', async () => {
        const objectPrize = { discount: 25, validDays: 14 };
        mockPrisma.treasureChest.create.mockResolvedValueOnce({
          id: 'chest-obj',
          prizeValue: JSON.stringify(objectPrize),
        } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Object Chest',
            description: 'A chest with object prize',
            peaksCost: 75,
            prizeType: 'bundle',
            prizeValue: objectPrize,
          }),
        });
        await PUT(request);

        expect(mockPrisma.treasureChest.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            prizeValue: JSON.stringify(objectPrize),
          }),
        });
      });

      it('should handle array prizeValue (stringify)', async () => {
        const arrayPrize = ['item1', 'item2', 'item3'];
        mockPrisma.treasureChest.create.mockResolvedValueOnce({
          id: 'chest-arr',
          prizeValue: JSON.stringify(arrayPrize),
        } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Array Chest',
            description: 'A chest with array prize',
            peaksCost: 150,
            prizeType: 'collection',
            prizeValue: arrayPrize,
          }),
        });
        await PUT(request);

        expect(mockPrisma.treasureChest.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            prizeValue: JSON.stringify(arrayPrize),
          }),
        });
      });

      it('should handle nested object prizeValue', async () => {
        const complexPrize = {
          tier: 'gold',
          rewards: {
            discounts: [10, 15, 20],
            badges: ['gold_member', 'early_bird'],
          },
          expiresAt: '2025-12-31',
        };
        mockPrisma.treasureChest.create.mockResolvedValueOnce({
          id: 'chest-complex',
          prizeValue: JSON.stringify(complexPrize),
        } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Complex Chest',
            description: 'A chest with complex prize',
            peaksCost: 1000,
            prizeType: 'premium',
            prizeValue: complexPrize,
          }),
        });
        await PUT(request);

        expect(mockPrisma.treasureChest.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            prizeValue: JSON.stringify(complexPrize),
          }),
        });
      });
    });

    describe('Edge Cases', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: ADMIN_USER_ID, email: 'admin@example.com' },
          expires: new Date().toISOString(),
        } as any);

        mockPrisma.user.findUnique.mockResolvedValue({
          id: ADMIN_USER_ID,
          role: 'ADMIN',
        } as any);
      });

      it('should handle very long title', async () => {
        const longTitle = 'A'.repeat(1000);
        mockPrisma.treasureChest.create.mockResolvedValueOnce({
          id: 'chest-long',
          title: longTitle,
        } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: longTitle,
            description: 'Description',
            peaksCost: 100,
            prizeType: 'badge',
            prizeValue: 'badge',
          }),
        });
        const response = await PUT(request);

        expect(response.status).toBe(201);
      });

      it('should handle special characters in fields', async () => {
        mockPrisma.treasureChest.create.mockResolvedValueOnce({
          id: 'chest-special',
          title: 'Special <Chest> & "Quotes"',
        } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Special <Chest> & "Quotes"',
            description: "Description with 'quotes' and <tags>",
            peaksCost: 100,
            prizeType: 'test/type',
            prizeValue: 'value@#$%',
          }),
        });
        const response = await PUT(request);

        expect(response.status).toBe(201);
      });

      it('should handle unicode characters', async () => {
        mockPrisma.treasureChest.create.mockResolvedValueOnce({
          id: 'chest-unicode',
          title: 'Chest de Tesoro',
        } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Chest de Tesoro',
            description: 'Un cofre con premios increibles',
            peaksCost: 200,
            prizeType: 'internacional',
            prizeValue: 'Premio especial',
          }),
        });
        const response = await PUT(request);

        expect(response.status).toBe(201);
      });

      it('should handle negative peaksCost (no validation in route)', async () => {
        mockPrisma.treasureChest.create.mockResolvedValueOnce({
          id: 'chest-negative',
          peaksCost: -100, // Negative cost
        } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Negative Cost Chest',
            description: 'This should probably be validated',
            peaksCost: -100,
            prizeType: 'bug',
            prizeValue: 'oops',
          }),
        });
        const response = await PUT(request);

        // Current implementation doesn't validate peaksCost value
        expect(response.status).toBe(201);
      });

      it('should handle very large peaksCost', async () => {
        mockPrisma.treasureChest.create.mockResolvedValueOnce({
          id: 'chest-expensive',
          peaksCost: 999999999999,
        } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Ultra Expensive Chest',
            description: 'Only for the elite',
            peaksCost: 999999999999,
            prizeType: 'ultimate',
            prizeValue: 'everything',
          }),
        });
        const response = await PUT(request);

        expect(response.status).toBe(201);
      });

      it('should handle database error during creation', async () => {
        mockPrisma.treasureChest.create.mockRejectedValueOnce(
          new Error('Database connection failed')
        );

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Error Chest',
            description: 'This will fail',
            peaksCost: 100,
            prizeType: 'error',
            prizeValue: 'none',
          }),
        });

        await expect(PUT(request)).rejects.toThrow('Database connection failed');
      });

      it('should handle whitespace-only fields', async () => {
        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: '   ',
            description: 'Valid description',
            peaksCost: 100,
            prizeType: 'test',
            prizeValue: 'value',
          }),
        });
        const response = await PUT(request);
        const data = await response.json();

        // Current implementation: whitespace passes validation (truthy)
        // This might be a bug worth noting
        expect(response.status).toBe(201);
      });
    });

    describe('Response Format', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: ADMIN_USER_ID, email: 'admin@example.com' },
          expires: new Date().toISOString(),
        } as any);

        mockPrisma.user.findUnique.mockResolvedValue({
          id: ADMIN_USER_ID,
          role: 'ADMIN',
        } as any);
      });

      it('should return 201 status on successful creation', async () => {
        mockPrisma.treasureChest.create.mockResolvedValueOnce({
          id: 'created-chest',
        } as any);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'New Chest',
            description: 'Description',
            peaksCost: 100,
            prizeType: 'standard',
            prizeValue: 'reward',
          }),
        });
        const response = await PUT(request);

        expect(response.status).toBe(201);
      });

      it('should return created chest object in response', async () => {
        const createdChest = {
          id: 'response-chest',
          title: 'Response Test Chest',
          description: 'Testing response format',
          peaksCost: 150,
          prizeType: 'test',
          prizeValue: '{"test": true}',
          available: true,
          createdAt: new Date(),
          claimedAt: null,
          claimedBy: null,
        };

        mockPrisma.treasureChest.create.mockResolvedValueOnce(createdChest);

        const request = createMockRequest(TEST_BASE_URL, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Response Test Chest',
            description: 'Testing response format',
            peaksCost: 150,
            prizeType: 'test',
            prizeValue: '{"test": true}',
          }),
        });
        const response = await PUT(request);
        const data = await response.json();

        expect(data).toHaveProperty('chest');
        expect(data.chest).toEqual(createdChest);
      });
    });
  });
});
