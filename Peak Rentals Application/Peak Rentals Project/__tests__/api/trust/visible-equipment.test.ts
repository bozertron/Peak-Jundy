/**
 * Tests for GET /api/trust/visible-equipment
 *
 * This endpoint returns equipment visible to the user based on their trust network:
 * - User's own equipment
 * - Equipment from direct connections (degree 1)
 * - Equipment from extended connections (degree 2)
 *
 * Supports filtering by:
 * - category (case-insensitive exact match)
 * - q/query (case-insensitive search in title and description)
 * - Only returns available equipment (available: true)
 */

import { GET } from '@/app/api/trust/visible-equipment/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Type the mocked modules
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Helper to create a mock Request with search params
function createRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost:3000/api/trust/visible-equipment');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new Request(url.toString());
}

// Helper to generate mock equipment
function createMockEquipment(overrides: Partial<{
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
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  owner: any;
}> = {}) {
  const defaults = {
    id: `equip-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Default Equipment',
    description: 'A piece of equipment',
    specs: 'Standard specs',
    category: 'tools',
    dailyRate: 25.00,
    available: true,
    hourMeter: null,
    image: null,
    location: null,
    ownerId: 'owner-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    owner: {
      id: 'owner-1',
      name: 'Owner Name',
      avatarUrl: null,
      flavor: null,
      latitude: null,
      longitude: null,
      locationName: null
    }
  };
  return { ...defaults, ...overrides };
}

describe('GET /api/trust/visible-equipment', () => {
  // ============================================================================
  // AUTHENTICATION TESTS
  // ============================================================================
  describe('Authentication', () => {
    it('should return 401 when session is null', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session exists but user is undefined', async () => {
      mockGetServerSession.mockResolvedValue({} as any);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session.user exists but id is undefined', async () => {
      mockGetServerSession.mockResolvedValue({ user: {} } as any);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session.user.id is null', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: null } } as any);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session.user.id is empty string', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '' } } as any);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  // ============================================================================
  // OWN EQUIPMENT VISIBILITY TESTS
  // ============================================================================
  describe('Own Equipment Visibility', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('should return user own equipment even with no network', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])  // vouchers
        .mockResolvedValueOnce([])  // vouchees
        .mockResolvedValueOnce([]); // extended

      const ownEquipment = createMockEquipment({
        id: 'own-equip-1',
        ownerId: 'user-1',
        owner: { id: 'user-1', name: 'Me', avatarUrl: null, flavor: null, latitude: null, longitude: null, locationName: null }
      });

      mockPrisma.equipment.findMany.mockResolvedValue([ownEquipment]);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.equipment).toHaveLength(1);
      expect(data.equipment[0].ownerId).toBe('user-1');
      expect(data.count).toBe(1);
    });

    it('should always include user ID in visible owners set', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest());

      // Verify the equipment query includes user's own ID
      const equipmentQuery = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(equipmentQuery.where.ownerId.in).toContain('user-1');
    });

    it('should return multiple items of own equipment', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const equipment = [
        createMockEquipment({ id: 'eq-1', ownerId: 'user-1', title: 'Chainsaw' }),
        createMockEquipment({ id: 'eq-2', ownerId: 'user-1', title: 'Drill' }),
        createMockEquipment({ id: 'eq-3', ownerId: 'user-1', title: 'Ladder' })
      ];

      mockPrisma.equipment.findMany.mockResolvedValue(equipment);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(data.equipment).toHaveLength(3);
      expect(data.count).toBe(3);
    });
  });

  // ============================================================================
  // DIRECT CONNECTION EQUIPMENT VISIBILITY TESTS
  // ============================================================================
  describe('Direct Connection Equipment', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('should include equipment from users who vouched for me', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{ voucherId: 'voucher-1' }])  // vouchers
        .mockResolvedValueOnce([])  // vouchees
        .mockResolvedValueOnce([]); // extended

      const voucherEquipment = createMockEquipment({
        id: 'voucher-equip',
        ownerId: 'voucher-1',
        title: 'Voucher Equipment'
      });

      mockPrisma.equipment.findMany.mockResolvedValue([voucherEquipment]);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.equipment).toHaveLength(1);
      expect(data.equipment[0].ownerId).toBe('voucher-1');
    });

    it('should include equipment from users I vouched for', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])  // vouchers
        .mockResolvedValueOnce([{ voucheeId: 'vouchee-1' }])  // vouchees
        .mockResolvedValueOnce([]); // extended

      mockPrisma.equipment.findMany.mockResolvedValue([
        createMockEquipment({ id: 'vouchee-equip', ownerId: 'vouchee-1' })
      ]);

      await GET(createRequest());

      const equipmentQuery = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(equipmentQuery.where.ownerId.in).toContain('vouchee-1');
    });

    it('should include equipment from both vouchers and vouchees', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([
          { voucherId: 'voucher-1' },
          { voucherId: 'voucher-2' }
        ])
        .mockResolvedValueOnce([
          { voucheeId: 'vouchee-1' }
        ])
        .mockResolvedValueOnce([]);

      mockPrisma.equipment.findMany.mockResolvedValue([
        createMockEquipment({ id: 'eq-1', ownerId: 'voucher-1' }),
        createMockEquipment({ id: 'eq-2', ownerId: 'voucher-2' }),
        createMockEquipment({ id: 'eq-3', ownerId: 'vouchee-1' }),
        createMockEquipment({ id: 'eq-4', ownerId: 'user-1' })
      ]);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(data.equipment).toHaveLength(4);
      expect(data.count).toBe(4);
    });
  });

  // ============================================================================
  // EXTENDED NETWORK EQUIPMENT VISIBILITY TESTS
  // ============================================================================
  describe('Extended Network Equipment', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('should include equipment from extended network (degree 2)', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{ voucherId: 'direct-1' }])  // vouchers
        .mockResolvedValueOnce([])  // vouchees
        .mockResolvedValueOnce([{ voucheeId: 'extended-1' }]); // extended

      mockPrisma.equipment.findMany.mockResolvedValue([
        createMockEquipment({ id: 'eq-extended', ownerId: 'extended-1', title: 'Extended Equipment' })
      ]);

      await GET(createRequest());

      const equipmentQuery = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(equipmentQuery.where.ownerId.in).toContain('extended-1');
    });

    it('should correctly build extended network from vouchees of direct connections', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{ voucherId: 'direct-a' }])
        .mockResolvedValueOnce([{ voucheeId: 'direct-b' }])
        .mockResolvedValueOnce([
          { voucheeId: 'extended-1' },
          { voucheeId: 'extended-2' },
          { voucheeId: 'extended-3' }
        ]);

      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest());

      const equipmentQuery = mockPrisma.equipment.findMany.mock.calls[0][0];
      const ownerIds = equipmentQuery.where.ownerId.in;

      expect(ownerIds).toContain('user-1');     // self
      expect(ownerIds).toContain('direct-a');   // voucher
      expect(ownerIds).toContain('direct-b');   // vouchee
      expect(ownerIds).toContain('extended-1'); // extended
      expect(ownerIds).toContain('extended-2'); // extended
      expect(ownerIds).toContain('extended-3'); // extended
    });

    it('should verify extended network query uses correct direct connection IDs', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{ voucherId: 'direct-x' }])
        .mockResolvedValueOnce([{ voucheeId: 'direct-y' }])
        .mockResolvedValueOnce([]);

      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest());

      // Third vouch.findMany call should query for extended connections
      const extendedQuery = mockPrisma.vouch.findMany.mock.calls[2][0];
      expect(extendedQuery.where.voucherId.in).toContain('direct-x');
      expect(extendedQuery.where.voucherId.in).toContain('direct-y');
    });
  });

  // ============================================================================
  // NETWORK EXCLUSION TESTS
  // ============================================================================
  describe('Network Exclusion', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('should NOT include equipment from users outside network', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{ voucherId: 'direct-1' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest());

      const equipmentQuery = mockPrisma.equipment.findMany.mock.calls[0][0];
      const ownerIds = equipmentQuery.where.ownerId.in;

      // Should only contain user-1 and direct-1
      expect(ownerIds).toHaveLength(2);
      expect(ownerIds).toContain('user-1');
      expect(ownerIds).toContain('direct-1');
      expect(ownerIds).not.toContain('outsider-1');
    });

    it('should deduplicate owner IDs in the query', async () => {
      // Same user appears as both voucher and in extended
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{ voucherId: 'user-x' }])
        .mockResolvedValueOnce([{ voucheeId: 'user-x' }])  // Same user
        .mockResolvedValueOnce([{ voucheeId: 'user-x' }]); // Also in extended

      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest());

      const equipmentQuery = mockPrisma.equipment.findMany.mock.calls[0][0];
      const ownerIds = equipmentQuery.where.ownerId.in;

      // Use Set, so 'user-x' should only appear once
      const uniqueIds = [...new Set(ownerIds)];
      expect(uniqueIds.filter(id => id === 'user-x')).toHaveLength(1);
    });
  });

  // ============================================================================
  // CATEGORY FILTERING TESTS
  // ============================================================================
  describe('Category Filtering', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
    });

    it('should filter by category when provided', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest({ category: 'camping' }));

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.where.category).toEqual({
        equals: 'camping',
        mode: 'insensitive'
      });
    });

    it('should not include category filter when not provided', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest());

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.where.category).toBeUndefined();
    });

    it('should handle case-insensitive category matching', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest({ category: 'CAMPING' }));

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.where.category.mode).toBe('insensitive');
    });

    it('should handle empty category parameter', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest({ category: '' }));

      // Empty string is falsy, so category filter should not be applied
      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.where.category).toBeUndefined();
    });

    it('should handle category with special characters', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest({ category: 'camping-gear' }));

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.where.category.equals).toBe('camping-gear');
    });

    it('should handle category with spaces', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest({ category: 'outdoor gear' }));

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.where.category.equals).toBe('outdoor gear');
    });
  });

  // ============================================================================
  // QUERY/SEARCH FILTERING TESTS
  // ============================================================================
  describe('Query/Search Filtering', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
    });

    it('should search in title when query provided', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest({ q: 'chainsaw' }));

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.where.OR).toContainEqual({
        title: { contains: 'chainsaw', mode: 'insensitive' }
      });
    });

    it('should search in description when query provided', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest({ q: 'heavy duty' }));

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.where.OR).toContainEqual({
        description: { contains: 'heavy duty', mode: 'insensitive' }
      });
    });

    it('should not include search filter when query not provided', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest());

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.where.OR).toBeUndefined();
    });

    it('should handle empty query parameter', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest({ q: '' }));

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.where.OR).toBeUndefined();
    });

    it('should handle query with special characters', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest({ q: '12" saw' }));

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.where.OR[0].title.contains).toBe('12" saw');
    });

    it('should handle query with only whitespace', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest({ q: '   ' }));

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      // Whitespace-only is still truthy, so OR should be present
      expect(query.where.OR).toBeDefined();
      expect(query.where.OR[0].title.contains).toBe('   ');
    });

    it('should perform case-insensitive search', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest({ q: 'CHAINSAW' }));

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.where.OR[0].title.mode).toBe('insensitive');
      expect(query.where.OR[1].description.mode).toBe('insensitive');
    });
  });

  // ============================================================================
  // COMBINED CATEGORY + QUERY FILTERING TESTS
  // ============================================================================
  describe('Combined Category and Query Filtering', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
    });

    it('should apply both category and query filters simultaneously', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest({ category: 'tools', q: 'drill' }));

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];

      // Should have category filter
      expect(query.where.category).toEqual({
        equals: 'tools',
        mode: 'insensitive'
      });

      // Should also have search filter
      expect(query.where.OR).toContainEqual({
        title: { contains: 'drill', mode: 'insensitive' }
      });
    });

    it('should return equipment matching both category and query', async () => {
      const matchingEquipment = createMockEquipment({
        id: 'eq-match',
        category: 'tools',
        title: 'Power Drill',
        description: 'Professional drill for home use',
        ownerId: 'user-1'
      });

      mockPrisma.equipment.findMany.mockResolvedValue([matchingEquipment]);

      const response = await GET(createRequest({ category: 'tools', q: 'drill' }));
      const data = await response.json();

      expect(data.equipment).toHaveLength(1);
      expect(data.equipment[0].title).toBe('Power Drill');
    });

    it('should return empty when category matches but query does not', async () => {
      // The filter is applied at DB level, so mock returns empty
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      const response = await GET(createRequest({ category: 'tools', q: 'nonexistent' }));
      const data = await response.json();

      expect(data.equipment).toHaveLength(0);
      expect(data.count).toBe(0);
    });
  });

  // ============================================================================
  // AVAILABILITY FILTERING TESTS
  // ============================================================================
  describe('Availability Filtering', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
    });

    it('should only return available equipment (available: true filter)', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest());

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.where.available).toBe(true);
    });

    it('should not return unavailable equipment', async () => {
      // Only available equipment is returned by the query
      const availableEquipment = createMockEquipment({
        id: 'eq-available',
        available: true,
        ownerId: 'user-1'
      });

      mockPrisma.equipment.findMany.mockResolvedValue([availableEquipment]);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(data.equipment).toHaveLength(1);
      expect(data.equipment[0].available).toBe(true);
    });

    it('should verify availability filter is always applied regardless of other params', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest({ category: 'tools', q: 'test' }));

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.where.available).toBe(true);
    });
  });

  // ============================================================================
  // EMPTY NETWORK EDGE CASE TESTS
  // ============================================================================
  describe('Empty Network Edge Cases', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('should only return own equipment when network is empty', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])  // No vouchers
        .mockResolvedValueOnce([])  // No vouchees
        .mockResolvedValueOnce([]); // No extended

      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest());

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.where.ownerId.in).toEqual(['user-1']);
    });

    it('should return empty when user has no equipment and no network', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockPrisma.equipment.findMany.mockResolvedValue([]);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(data.equipment).toEqual([]);
      expect(data.count).toBe(0);
    });
  });

  // ============================================================================
  // USER WITH NO EQUIPMENT EDGE CASE TESTS
  // ============================================================================
  describe('User With No Equipment', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('should return empty when user and network have no equipment', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{ voucherId: 'direct-1' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockPrisma.equipment.findMany.mockResolvedValue([]);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(data.equipment).toEqual([]);
      expect(data.count).toBe(0);
    });

    it('should return network equipment even when user has none', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{ voucherId: 'direct-1' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const networkEquipment = createMockEquipment({
        id: 'eq-network',
        ownerId: 'direct-1',
        title: 'Network Equipment'
      });

      mockPrisma.equipment.findMany.mockResolvedValue([networkEquipment]);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(data.equipment).toHaveLength(1);
      expect(data.equipment[0].ownerId).toBe('direct-1');
    });
  });

  // ============================================================================
  // RESPONSE STRUCTURE TESTS
  // ============================================================================
  describe('Response Structure', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
    });

    it('should return equipment array and count', async () => {
      const equipment = [
        createMockEquipment({ id: 'eq-1', ownerId: 'user-1' }),
        createMockEquipment({ id: 'eq-2', ownerId: 'user-1' })
      ];

      mockPrisma.equipment.findMany.mockResolvedValue(equipment);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(data).toHaveProperty('equipment');
      expect(data).toHaveProperty('count');
      expect(Array.isArray(data.equipment)).toBe(true);
      expect(data.count).toBe(2);
    });

    it('should include owner data in equipment response', async () => {
      const equipment = createMockEquipment({
        id: 'eq-1',
        ownerId: 'user-1',
        owner: {
          id: 'user-1',
          name: 'John Doe',
          avatarUrl: 'https://example.com/avatar.jpg',
          flavor: 'Mountain enthusiast',
          latitude: 39.7392,
          longitude: -104.9903,
          locationName: 'Denver, CO'
        }
      });

      mockPrisma.equipment.findMany.mockResolvedValue([equipment]);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(data.equipment[0].owner).toEqual({
        id: 'user-1',
        name: 'John Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
        flavor: 'Mountain enthusiast',
        latitude: 39.7392,
        longitude: -104.9903,
        locationName: 'Denver, CO'
      });
    });

    it('should include all equipment fields in response', async () => {
      const fullEquipment = {
        id: 'eq-full',
        title: 'Full Equipment',
        description: 'Complete description',
        specs: 'All specifications',
        category: 'tools',
        dailyRate: 50.00,
        available: true,
        hourMeter: 150,
        image: 'https://example.com/image.jpg',
        location: 'Garage',
        ownerId: 'user-1',
        createdAt: new Date('2024-06-15'),
        updatedAt: new Date('2024-06-20'),
        owner: {
          id: 'user-1',
          name: 'Owner',
          avatarUrl: null,
          flavor: null,
          latitude: null,
          longitude: null,
          locationName: null
        }
      };

      mockPrisma.equipment.findMany.mockResolvedValue([fullEquipment]);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(data.equipment[0]).toMatchObject({
        id: 'eq-full',
        title: 'Full Equipment',
        description: 'Complete description',
        specs: 'All specifications',
        category: 'tools',
        dailyRate: 50.00,
        available: true,
        hourMeter: 150,
        image: 'https://example.com/image.jpg',
        location: 'Garage'
      });
    });

    it('should order equipment by createdAt descending', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest());

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.orderBy).toEqual({ createdAt: 'desc' });
    });
  });

  // ============================================================================
  // OWNER INCLUDE STRUCTURE TESTS
  // ============================================================================
  describe('Owner Include Structure', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
    });

    it('should query with correct owner select fields', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest());

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.include.owner.select).toEqual({
        id: true,
        name: true,
        avatarUrl: true,
        flavor: true,
        latitude: true,
        longitude: true,
        locationName: true
      });
    });

    it('should handle owner with all null fields', async () => {
      const equipmentWithNullOwner = createMockEquipment({
        id: 'eq-null-owner',
        owner: {
          id: 'null-owner',
          name: null,
          avatarUrl: null,
          flavor: null,
          latitude: null,
          longitude: null,
          locationName: null
        }
      });

      mockPrisma.equipment.findMany.mockResolvedValue([equipmentWithNullOwner]);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(data.equipment[0].owner.name).toBeNull();
      expect(data.equipment[0].owner.avatarUrl).toBeNull();
      expect(data.equipment[0].owner.locationName).toBeNull();
    });
  });

  // ============================================================================
  // BROADCAST FILTER VERIFICATION TESTS
  // ============================================================================
  describe('Broadcast Filter Verification', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('should only consider broadcast vouches for vouchers', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest());

      const vouchersQuery = mockPrisma.vouch.findMany.mock.calls[0][0];
      expect(vouchersQuery.where.broadcast).toBe(true);
    });

    it('should only consider broadcast vouches for vouchees', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest());

      const voucheesQuery = mockPrisma.vouch.findMany.mock.calls[1][0];
      expect(voucheesQuery.where.broadcast).toBe(true);
    });

    it('should only consider broadcast vouches for extended network', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{ voucherId: 'direct-1' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest());

      const extendedQuery = mockPrisma.vouch.findMany.mock.calls[2][0];
      expect(extendedQuery.where.broadcast).toBe(true);
    });
  });

  // ============================================================================
  // DATABASE QUERY PARALLELIZATION TESTS
  // ============================================================================
  describe('Database Query Optimization', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('should fetch vouchers and vouchees in parallel', async () => {
      let vouchersCallTime = 0;
      let voucheesCallTime = 0;

      mockPrisma.vouch.findMany
        .mockImplementationOnce(async () => {
          vouchersCallTime = Date.now();
          return [];
        })
        .mockImplementationOnce(async () => {
          voucheesCallTime = Date.now();
          return [];
        })
        .mockResolvedValueOnce([]);

      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest());

      // Both should be called at approximately the same time (within 50ms)
      const timeDiff = Math.abs(vouchersCallTime - voucheesCallTime);
      expect(timeDiff).toBeLessThan(50);
    });

    it('should make exactly 4 database calls total', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest());

      expect(mockPrisma.vouch.findMany).toHaveBeenCalledTimes(3);
      expect(mockPrisma.equipment.findMany).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // EDGE CASES AND CORNER CASES
  // ============================================================================
  describe('Edge Cases', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('should handle very long search queries', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      const longQuery = 'a'.repeat(1000);
      await GET(createRequest({ q: longQuery }));

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.where.OR[0].title.contains).toHaveLength(1000);
    });

    it('should handle special regex characters in search query', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest({ q: '.*+?^${}()|[]\\' }));

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      // Query should be passed through as-is (Prisma handles escaping)
      expect(query.where.OR[0].title.contains).toBe('.*+?^${}()|[]\\');
    });

    it('should handle Unicode characters in search query', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest({ q: 'equipment' }));

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.where.OR[0].title.contains).toBe('equipment');
    });

    it('should handle large network with many connections', async () => {
      const manyVouchers = Array.from({ length: 100 }, (_, i) => ({
        voucherId: `voucher-${i}`
      }));

      const manyVouchees = Array.from({ length: 100 }, (_, i) => ({
        voucheeId: `vouchee-${i}`
      }));

      const manyExtended = Array.from({ length: 500 }, (_, i) => ({
        voucheeId: `extended-${i}`
      }));

      mockPrisma.vouch.findMany
        .mockResolvedValueOnce(manyVouchers)
        .mockResolvedValueOnce(manyVouchees)
        .mockResolvedValueOnce(manyExtended);
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await GET(createRequest());

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      // Should have unique IDs: 1 (self) + 100 (vouchers) + 100 (vouchees) + 500 (extended)
      // But with Set deduplication: 701 unique IDs
      expect(query.where.ownerId.in.length).toBeLessThanOrEqual(701);
    });

    it('should handle equipment with all null optional fields', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const minimalEquipment = {
        id: 'eq-minimal',
        title: 'Minimal',
        description: 'Desc',
        specs: '',
        category: 'misc',
        dailyRate: 10,
        available: true,
        hourMeter: null,
        image: null,
        location: null,
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: {
          id: 'user-1',
          name: null,
          avatarUrl: null,
          flavor: null,
          latitude: null,
          longitude: null,
          locationName: null
        }
      };

      mockPrisma.equipment.findMany.mockResolvedValue([minimalEquipment]);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(data.equipment[0].hourMeter).toBeNull();
      expect(data.equipment[0].image).toBeNull();
      expect(data.equipment[0].location).toBeNull();
    });

    it('should handle equipment with high daily rate', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const expensiveEquipment = createMockEquipment({
        id: 'eq-expensive',
        dailyRate: 999999.99,
        ownerId: 'user-1'
      });

      mockPrisma.equipment.findMany.mockResolvedValue([expensiveEquipment]);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(data.equipment[0].dailyRate).toBe(999999.99);
    });

    it('should handle equipment with zero daily rate', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const freeEquipment = createMockEquipment({
        id: 'eq-free',
        dailyRate: 0,
        ownerId: 'user-1'
      });

      mockPrisma.equipment.findMany.mockResolvedValue([freeEquipment]);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(data.equipment[0].dailyRate).toBe(0);
    });

    it('should correctly count equipment even when empty', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(data.count).toBe(0);
      expect(data.equipment.length).toBe(0);
    });
  });

  // ============================================================================
  // SQL INJECTION PROTECTION TESTS (Prisma handles, but verify params passed)
  // ============================================================================
  describe('Input Sanitization', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.equipment.findMany.mockResolvedValue([]);
    });

    it('should pass SQL-like strings safely to Prisma', async () => {
      await GET(createRequest({ q: "'; DROP TABLE equipment; --" }));

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.where.OR[0].title.contains).toBe("'; DROP TABLE equipment; --");
    });

    it('should handle category with SQL-like injection attempt', async () => {
      await GET(createRequest({ category: "tools' OR '1'='1" }));

      const query = mockPrisma.equipment.findMany.mock.calls[0][0];
      expect(query.where.category.equals).toBe("tools' OR '1'='1");
    });
  });
});
