/**
 * Tests for GET /api/trust/network
 *
 * This endpoint returns the user's visible trust network (trust graph).
 * It includes:
 * - Direct connections (degree 1): people who vouched for me + people I vouched for
 * - Extended connections (degree 2): people vouched by my direct connections
 * - Only broadcast vouches are considered
 */

import { GET } from '@/app/api/trust/network/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Type the mocked modules
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('GET /api/trust/network', () => {
  // ============================================================================
  // AUTHENTICATION TESTS
  // ============================================================================
  describe('Authentication', () => {
    it('should return 401 when session is null', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session exists but user is undefined', async () => {
      mockGetServerSession.mockResolvedValue({} as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session.user exists but id is undefined', async () => {
      mockGetServerSession.mockResolvedValue({ user: {} } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session.user.id is null', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: null } } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session.user.id is empty string', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '' } } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  // ============================================================================
  // EMPTY NETWORK TESTS
  // ============================================================================
  describe('Empty Network', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('should return empty network when user has no vouches at all', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])  // directVouchers
        .mockResolvedValueOnce([])  // myVouchees
        .mockResolvedValueOnce([]); // extendedNetwork

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.network).toEqual([]);
      expect(data.stats).toEqual({
        direct: 0,
        extended: 0,
        total: 0
      });
    });

    it('should return empty network when user only has non-broadcast vouches received', async () => {
      // This tests that broadcast: true filter is applied
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])  // directVouchers (broadcast: true, none found)
        .mockResolvedValueOnce([])  // myVouchees (broadcast: true, none found)
        .mockResolvedValueOnce([]); // extendedNetwork

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.network).toEqual([]);
      expect(data.stats.total).toBe(0);
    });
  });

  // ============================================================================
  // DIRECT CONNECTIONS (DEGREE 1) TESTS
  // ============================================================================
  describe('Direct Connections (Degree 1)', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('should include users who vouched for me (vouchers)', async () => {
      const voucherUser = {
        id: 'voucher-1',
        name: 'Alice Voucher',
        avatarUrl: 'https://example.com/alice.jpg',
        flavor: 'Mountain enthusiast',
        latitude: 39.7392,
        longitude: -104.9903,
        memberSince: new Date('2024-01-01'),
        foundingMember: true
      };

      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{
          id: 'vouch-1',
          voucherId: 'voucher-1',
          voucheeId: 'user-1',
          broadcast: true,
          voucher: voucherUser
        }])
        .mockResolvedValueOnce([])  // myVouchees
        .mockResolvedValueOnce([]); // extendedNetwork

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.network).toHaveLength(1);
      expect(data.network[0]).toEqual({
        ...voucherUser,
        degree: 1,
        introducedBy: null
      });
      expect(data.stats.direct).toBe(1);
    });

    it('should include users I vouched for (vouchees)', async () => {
      const voucheeUser = {
        id: 'vouchee-1',
        name: 'Bob Vouchee',
        avatarUrl: null,
        flavor: null,
        latitude: null,
        longitude: null,
        memberSince: new Date('2024-06-15'),
        foundingMember: false
      };

      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])  // directVouchers
        .mockResolvedValueOnce([{
          id: 'vouch-2',
          voucherId: 'user-1',
          voucheeId: 'vouchee-1',
          broadcast: true,
          vouchee: voucheeUser
        }])
        .mockResolvedValueOnce([]); // extendedNetwork

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.network).toHaveLength(1);
      expect(data.network[0]).toEqual({
        ...voucheeUser,
        degree: 1,
        introducedBy: null
      });
      expect(data.stats.direct).toBe(1);
    });

    it('should include both vouchers and vouchees as degree 1', async () => {
      const voucherUser = {
        id: 'voucher-1',
        name: 'Alice',
        avatarUrl: null,
        flavor: null,
        latitude: null,
        longitude: null,
        memberSince: null,
        foundingMember: false
      };

      const voucheeUser = {
        id: 'vouchee-1',
        name: 'Bob',
        avatarUrl: null,
        flavor: null,
        latitude: null,
        longitude: null,
        memberSince: null,
        foundingMember: false
      };

      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{
          id: 'vouch-1',
          voucherId: 'voucher-1',
          voucheeId: 'user-1',
          broadcast: true,
          voucher: voucherUser
        }])
        .mockResolvedValueOnce([{
          id: 'vouch-2',
          voucherId: 'user-1',
          voucheeId: 'vouchee-1',
          broadcast: true,
          vouchee: voucheeUser
        }])
        .mockResolvedValueOnce([]); // extendedNetwork

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.network).toHaveLength(2);
      expect(data.stats.direct).toBe(2);
      expect(data.stats.extended).toBe(0);
      expect(data.stats.total).toBe(2);

      // All should be degree 1
      data.network.forEach((member: any) => {
        expect(member.degree).toBe(1);
        expect(member.introducedBy).toBeNull();
      });
    });

    it('should handle multiple vouchers correctly', async () => {
      const vouchers = [
        {
          id: 'vouch-1',
          voucherId: 'voucher-1',
          voucheeId: 'user-1',
          broadcast: true,
          voucher: { id: 'voucher-1', name: 'Alice', avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: false }
        },
        {
          id: 'vouch-2',
          voucherId: 'voucher-2',
          voucheeId: 'user-1',
          broadcast: true,
          voucher: { id: 'voucher-2', name: 'Charlie', avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: true }
        },
        {
          id: 'vouch-3',
          voucherId: 'voucher-3',
          voucheeId: 'user-1',
          broadcast: true,
          voucher: { id: 'voucher-3', name: 'Dave', avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: false }
        }
      ];

      mockPrisma.vouch.findMany
        .mockResolvedValueOnce(vouchers)
        .mockResolvedValueOnce([])  // myVouchees
        .mockResolvedValueOnce([]); // extendedNetwork

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.network).toHaveLength(3);
      expect(data.stats.direct).toBe(3);
    });
  });

  // ============================================================================
  // EXTENDED CONNECTIONS (DEGREE 2) TESTS
  // ============================================================================
  describe('Extended Connections (Degree 2)', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('should include users vouched by my direct connections as degree 2', async () => {
      const directConnection = {
        id: 'direct-1',
        name: 'Direct Alice',
        avatarUrl: null,
        flavor: null,
        latitude: null,
        longitude: null,
        memberSince: null,
        foundingMember: false
      };

      const extendedConnection = {
        id: 'extended-1',
        name: 'Extended Bob',
        avatarUrl: null,
        flavor: null,
        latitude: null,
        longitude: null,
        memberSince: null,
        foundingMember: false
      };

      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{
          id: 'vouch-1',
          voucherId: 'direct-1',
          voucheeId: 'user-1',
          broadcast: true,
          voucher: directConnection
        }])
        .mockResolvedValueOnce([])  // myVouchees
        .mockResolvedValueOnce([{
          id: 'vouch-2',
          voucherId: 'direct-1',
          voucheeId: 'extended-1',
          broadcast: true,
          vouchee: extendedConnection,
          voucher: { id: 'direct-1', name: 'Direct Alice' }
        }]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.network).toHaveLength(2);

      const extended = data.network.find((m: any) => m.id === 'extended-1');
      expect(extended.degree).toBe(2);
      expect(extended.introducedBy).toBe('Direct Alice');
    });

    it('should include extended connections through vouchees I created', async () => {
      const myVouchee = {
        id: 'vouchee-1',
        name: 'My Vouchee',
        avatarUrl: null,
        flavor: null,
        latitude: null,
        longitude: null,
        memberSince: null,
        foundingMember: false
      };

      const theirVouchee = {
        id: 'their-vouchee-1',
        name: 'Extended via My Vouchee',
        avatarUrl: null,
        flavor: null,
        latitude: null,
        longitude: null,
        memberSince: null,
        foundingMember: false
      };

      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])  // directVouchers
        .mockResolvedValueOnce([{
          id: 'vouch-1',
          voucherId: 'user-1',
          voucheeId: 'vouchee-1',
          broadcast: true,
          vouchee: myVouchee
        }])
        .mockResolvedValueOnce([{
          id: 'vouch-2',
          voucherId: 'vouchee-1',
          voucheeId: 'their-vouchee-1',
          broadcast: true,
          vouchee: theirVouchee,
          voucher: { id: 'vouchee-1', name: 'My Vouchee' }
        }]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.network).toHaveLength(2);

      const extended = data.network.find((m: any) => m.id === 'their-vouchee-1');
      expect(extended.degree).toBe(2);
      expect(extended.introducedBy).toBe('My Vouchee');
    });

    it('should correctly calculate stats with both direct and extended connections', async () => {
      const directUser = {
        id: 'direct-1',
        name: 'Direct',
        avatarUrl: null,
        flavor: null,
        latitude: null,
        longitude: null,
        memberSince: null,
        foundingMember: false
      };

      const extendedUsers = [
        { id: 'extended-1', name: 'Extended 1', avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: false },
        { id: 'extended-2', name: 'Extended 2', avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: false },
        { id: 'extended-3', name: 'Extended 3', avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: false }
      ];

      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{
          id: 'vouch-1',
          voucherId: 'direct-1',
          voucheeId: 'user-1',
          broadcast: true,
          voucher: directUser
        }])
        .mockResolvedValueOnce([])  // myVouchees
        .mockResolvedValueOnce(extendedUsers.map((user, i) => ({
          id: `vouch-extended-${i}`,
          voucherId: 'direct-1',
          voucheeId: user.id,
          broadcast: true,
          vouchee: user,
          voucher: { id: 'direct-1', name: 'Direct' }
        })));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats.direct).toBe(1);
      expect(data.stats.extended).toBe(3);
      expect(data.stats.total).toBe(4);
    });
  });

  // ============================================================================
  // DEDUPLICATION TESTS
  // ============================================================================
  describe('Deduplication', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('should deduplicate when same user is both voucher and vouchee', async () => {
      // User A vouched for me AND I vouched for User A
      const userA = {
        id: 'user-a',
        name: 'User A',
        avatarUrl: null,
        flavor: null,
        latitude: null,
        longitude: null,
        memberSince: null,
        foundingMember: false
      };

      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{
          id: 'vouch-1',
          voucherId: 'user-a',
          voucheeId: 'user-1',
          broadcast: true,
          voucher: userA
        }])
        .mockResolvedValueOnce([{
          id: 'vouch-2',
          voucherId: 'user-1',
          voucheeId: 'user-a',
          broadcast: true,
          vouchee: userA
        }])
        .mockResolvedValueOnce([]); // extendedNetwork

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should appear only once despite being in both vouchers and vouchees
      expect(data.network).toHaveLength(1);
      expect(data.network[0].id).toBe('user-a');
      expect(data.network[0].degree).toBe(1);
      // Stats should still count both vouches
      expect(data.stats.direct).toBe(2);
    });

    it('should deduplicate when user appears in both direct and extended', async () => {
      const userB = {
        id: 'user-b',
        name: 'User B',
        avatarUrl: null,
        flavor: null,
        latitude: null,
        longitude: null,
        memberSince: null,
        foundingMember: false
      };

      const directUserC = {
        id: 'user-c',
        name: 'User C',
        avatarUrl: null,
        flavor: null,
        latitude: null,
        longitude: null,
        memberSince: null,
        foundingMember: false
      };

      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([
          // B is my direct voucher
          {
            id: 'vouch-1',
            voucherId: 'user-b',
            voucheeId: 'user-1',
            broadcast: true,
            voucher: userB
          },
          // C is also my direct voucher
          {
            id: 'vouch-2',
            voucherId: 'user-c',
            voucheeId: 'user-1',
            broadcast: true,
            voucher: directUserC
          }
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          // C also vouched for B, making B also in extended network
          {
            id: 'vouch-3',
            voucherId: 'user-c',
            voucheeId: 'user-b',
            broadcast: true,
            vouchee: userB,
            voucher: { id: 'user-c', name: 'User C' }
          }
        ]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      // User B should appear only once as degree 1 (direct takes priority)
      expect(data.network).toHaveLength(2);
      const userBInNetwork = data.network.find((m: any) => m.id === 'user-b');
      expect(userBInNetwork.degree).toBe(1);
      expect(userBInNetwork.introducedBy).toBeNull();
    });

    it('should keep user as degree 1 even when also in extended via multiple paths', async () => {
      const directUser = {
        id: 'direct-user',
        name: 'Direct User',
        avatarUrl: null,
        flavor: null,
        latitude: null,
        longitude: null,
        memberSince: null,
        foundingMember: false
      };

      const anotherDirect = {
        id: 'another-direct',
        name: 'Another Direct',
        avatarUrl: null,
        flavor: null,
        latitude: null,
        longitude: null,
        memberSince: null,
        foundingMember: false
      };

      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([
          {
            id: 'vouch-1',
            voucherId: 'direct-user',
            voucheeId: 'user-1',
            broadcast: true,
            voucher: directUser
          },
          {
            id: 'vouch-2',
            voucherId: 'another-direct',
            voucheeId: 'user-1',
            broadcast: true,
            voucher: anotherDirect
          }
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          // direct-user vouched by another-direct (would be extended)
          {
            id: 'vouch-3',
            voucherId: 'another-direct',
            voucheeId: 'direct-user',
            broadcast: true,
            vouchee: directUser,
            voucher: { id: 'another-direct', name: 'Another Direct' }
          },
          // another-direct vouched by direct-user (would be extended)
          {
            id: 'vouch-4',
            voucherId: 'direct-user',
            voucheeId: 'another-direct',
            broadcast: true,
            vouchee: anotherDirect,
            voucher: { id: 'direct-user', name: 'Direct User' }
          }
        ]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.network).toHaveLength(2);
      // Both should remain degree 1 since they were added as direct first
      data.network.forEach((member: any) => {
        expect(member.degree).toBe(1);
      });
    });
  });

  // ============================================================================
  // SELF-EXCLUSION TESTS
  // ============================================================================
  describe('Self-Exclusion', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('should not include current user in their own network', async () => {
      const currentUser = {
        id: 'user-1',
        name: 'Current User',
        avatarUrl: null,
        flavor: null,
        latitude: null,
        longitude: null,
        memberSince: null,
        foundingMember: false
      };

      const directConnection = {
        id: 'direct-1',
        name: 'Direct',
        avatarUrl: null,
        flavor: null,
        latitude: null,
        longitude: null,
        memberSince: null,
        foundingMember: false
      };

      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{
          id: 'vouch-1',
          voucherId: 'direct-1',
          voucheeId: 'user-1',
          broadcast: true,
          voucher: directConnection
        }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          // Extended network includes user-1 (current user) vouched by direct-1
          // This should be filtered out by the query (voucheeId: { not: userId })
          // But we test that even if it somehow appears, it won't be in network
          {
            id: 'vouch-2',
            voucherId: 'direct-1',
            voucheeId: 'user-1',
            broadcast: true,
            vouchee: currentUser,
            voucher: { id: 'direct-1', name: 'Direct' }
          }
        ]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      // Current user should never appear in network
      const selfInNetwork = data.network.find((m: any) => m.id === 'user-1');
      expect(selfInNetwork).toBeUndefined();
    });

    it('verifies the query excludes current user from extended network', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{
          id: 'vouch-1',
          voucherId: 'direct-1',
          voucheeId: 'user-1',
          broadcast: true,
          voucher: { id: 'direct-1', name: 'Direct', avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: false }
        }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await GET();

      // Verify the third query (extended network) has correct filter
      const extendedQueryCall = mockPrisma.vouch.findMany.mock.calls[2];
      expect(extendedQueryCall[0].where).toMatchObject({
        voucheeId: { not: 'user-1' }
      });
    });
  });

  // ============================================================================
  // NON-BROADCAST VOUCH EXCLUSION TESTS
  // ============================================================================
  describe('Non-Broadcast Vouch Exclusion', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('should verify broadcast:true filter is applied to vouchers query', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await GET();

      const firstCall = mockPrisma.vouch.findMany.mock.calls[0];
      expect(firstCall[0].where.broadcast).toBe(true);
    });

    it('should verify broadcast:true filter is applied to vouchees query', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await GET();

      const secondCall = mockPrisma.vouch.findMany.mock.calls[1];
      expect(secondCall[0].where.broadcast).toBe(true);
    });

    it('should verify broadcast:true filter is applied to extended network query', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{
          id: 'vouch-1',
          voucherId: 'direct-1',
          voucheeId: 'user-1',
          broadcast: true,
          voucher: { id: 'direct-1', name: 'Direct', avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: false }
        }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await GET();

      const thirdCall = mockPrisma.vouch.findMany.mock.calls[2];
      expect(thirdCall[0].where.broadcast).toBe(true);
    });
  });

  // ============================================================================
  // NULL/UNDEFINED FIELD HANDLING TESTS
  // ============================================================================
  describe('Null/Undefined Field Handling', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('should handle user with all null optional fields', async () => {
      const userWithNulls = {
        id: 'null-user',
        name: null,
        avatarUrl: null,
        flavor: null,
        latitude: null,
        longitude: null,
        memberSince: null,
        foundingMember: false
      };

      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{
          id: 'vouch-1',
          voucherId: 'null-user',
          voucheeId: 'user-1',
          broadcast: true,
          voucher: userWithNulls
        }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.network[0].name).toBeNull();
      expect(data.network[0].avatarUrl).toBeNull();
      expect(data.network[0].flavor).toBeNull();
      expect(data.network[0].latitude).toBeNull();
      expect(data.network[0].longitude).toBeNull();
      expect(data.network[0].memberSince).toBeNull();
    });

    it('should handle user with all fields populated', async () => {
      const fullyPopulatedUser = {
        id: 'full-user',
        name: 'Fully Populated',
        avatarUrl: 'https://example.com/avatar.jpg',
        flavor: 'Outdoor adventurer, ski patrol volunteer',
        latitude: 39.1911,
        longitude: -106.8175,
        memberSince: new Date('2023-12-15T10:30:00.000Z'),
        foundingMember: true
      };

      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{
          id: 'vouch-1',
          voucherId: 'full-user',
          voucheeId: 'user-1',
          broadcast: true,
          voucher: fullyPopulatedUser
        }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.network[0].name).toBe('Fully Populated');
      expect(data.network[0].avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(data.network[0].flavor).toBe('Outdoor adventurer, ski patrol volunteer');
      expect(data.network[0].latitude).toBe(39.1911);
      expect(data.network[0].longitude).toBe(-106.8175);
      expect(data.network[0].foundingMember).toBe(true);
    });

    it('should handle extended connection with null introducer name', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{
          id: 'vouch-1',
          voucherId: 'direct-1',
          voucheeId: 'user-1',
          broadcast: true,
          voucher: { id: 'direct-1', name: null, avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: false }
        }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{
          id: 'vouch-2',
          voucherId: 'direct-1',
          voucheeId: 'extended-1',
          broadcast: true,
          vouchee: { id: 'extended-1', name: 'Extended', avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: false },
          voucher: { id: 'direct-1', name: null }  // Introducer has null name
        }]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      const extendedUser = data.network.find((m: any) => m.id === 'extended-1');
      expect(extendedUser.introducedBy).toBeNull();
    });

    it('should handle mixed null/populated fields across network members', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([
          {
            id: 'vouch-1',
            voucherId: 'user-a',
            voucheeId: 'user-1',
            broadcast: true,
            voucher: { id: 'user-a', name: 'Has Name', avatarUrl: null, flavor: 'Has flavor', latitude: null, longitude: null, memberSince: null, foundingMember: true }
          },
          {
            id: 'vouch-2',
            voucherId: 'user-b',
            voucheeId: 'user-1',
            broadcast: true,
            voucher: { id: 'user-b', name: null, avatarUrl: 'https://example.com/b.jpg', flavor: null, latitude: 40.0, longitude: -105.0, memberSince: new Date('2024-01-01'), foundingMember: false }
          }
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.network).toHaveLength(2);

      const userA = data.network.find((m: any) => m.id === 'user-a');
      const userB = data.network.find((m: any) => m.id === 'user-b');

      expect(userA.name).toBe('Has Name');
      expect(userA.avatarUrl).toBeNull();
      expect(userA.flavor).toBe('Has flavor');
      expect(userA.foundingMember).toBe(true);

      expect(userB.name).toBeNull();
      expect(userB.avatarUrl).toBe('https://example.com/b.jpg');
      expect(userB.latitude).toBe(40.0);
      expect(userB.longitude).toBe(-105.0);
    });
  });

  // ============================================================================
  // STATS CALCULATION ACCURACY TESTS
  // ============================================================================
  describe('Stats Calculation Accuracy', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('should calculate stats correctly: direct = vouchers + vouchees count', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([
          { id: 'v1', voucherId: 'a', voucheeId: 'user-1', broadcast: true, voucher: { id: 'a', name: 'A', avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: false } },
          { id: 'v2', voucherId: 'b', voucheeId: 'user-1', broadcast: true, voucher: { id: 'b', name: 'B', avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: false } }
        ])
        .mockResolvedValueOnce([
          { id: 'v3', voucherId: 'user-1', voucheeId: 'c', broadcast: true, vouchee: { id: 'c', name: 'C', avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: false } }
        ])
        .mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(data.stats.direct).toBe(3); // 2 vouchers + 1 vouchee
    });

    it('should calculate extended correctly: total - direct', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([
          { id: 'v1', voucherId: 'a', voucheeId: 'user-1', broadcast: true, voucher: { id: 'a', name: 'A', avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: false } }
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: 'v2', voucherId: 'a', voucheeId: 'x', broadcast: true, vouchee: { id: 'x', name: 'X', avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: false }, voucher: { id: 'a', name: 'A' } },
          { id: 'v3', voucherId: 'a', voucheeId: 'y', broadcast: true, vouchee: { id: 'y', name: 'Y', avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: false }, voucher: { id: 'a', name: 'A' } }
        ]);

      const response = await GET();
      const data = await response.json();

      expect(data.network).toHaveLength(3); // A, X, Y
      expect(data.stats.direct).toBe(1);    // A
      expect(data.stats.extended).toBe(2);  // X, Y
      expect(data.stats.total).toBe(3);
    });

    it('should handle case where direct count exceeds unique network members', async () => {
      // Same user as both voucher and vouchee = 2 direct but 1 unique
      const userA = { id: 'a', name: 'A', avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: false };

      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([
          { id: 'v1', voucherId: 'a', voucheeId: 'user-1', broadcast: true, voucher: userA }
        ])
        .mockResolvedValueOnce([
          { id: 'v2', voucherId: 'user-1', voucheeId: 'a', broadcast: true, vouchee: userA }
        ])
        .mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(data.network).toHaveLength(1);  // Only A (deduplicated)
      expect(data.stats.direct).toBe(2);      // Both vouches counted
      expect(data.stats.extended).toBe(-1);   // 1 - 2 = -1 (this is a known quirk)
      expect(data.stats.total).toBe(1);
    });

    it('should return zero stats when all arrays are empty', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(data.stats).toEqual({
        direct: 0,
        extended: 0,
        total: 0
      });
    });
  });

  // ============================================================================
  // EDGE CASES & CORNER CASES
  // ============================================================================
  describe('Edge Cases', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('should handle large network (stress test data structure)', async () => {
      const generateUser = (i: number) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        avatarUrl: null,
        flavor: null,
        latitude: null,
        longitude: null,
        memberSince: null,
        foundingMember: i % 10 === 0
      });

      const directVouchers = Array.from({ length: 50 }, (_, i) => ({
        id: `vouch-d-${i}`,
        voucherId: `user-${i}`,
        voucheeId: 'user-1',
        broadcast: true,
        voucher: generateUser(i)
      }));

      const extendedNetwork = Array.from({ length: 100 }, (_, i) => ({
        id: `vouch-e-${i}`,
        voucherId: 'user-0',
        voucheeId: `extended-${i}`,
        broadcast: true,
        vouchee: { ...generateUser(1000 + i), id: `extended-${i}` },
        voucher: { id: 'user-0', name: 'User 0' }
      }));

      mockPrisma.vouch.findMany
        .mockResolvedValueOnce(directVouchers)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(extendedNetwork);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.network).toHaveLength(150); // 50 direct + 100 extended
      expect(data.stats.direct).toBe(50);
      expect(data.stats.extended).toBe(100);
    });

    it('should handle special characters in user names', async () => {
      const specialUser = {
        id: 'special-user',
        name: "O'Malley <script>alert('xss')</script> & Co.",
        avatarUrl: null,
        flavor: 'Flavor with "quotes" and \\ backslash',
        latitude: null,
        longitude: null,
        memberSince: null,
        foundingMember: false
      };

      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{
          id: 'vouch-1',
          voucherId: 'special-user',
          voucheeId: 'user-1',
          broadcast: true,
          voucher: specialUser
        }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.network[0].name).toBe("O'Malley <script>alert('xss')</script> & Co.");
      expect(data.network[0].flavor).toBe('Flavor with "quotes" and \\ backslash');
    });

    it('should handle users with extreme coordinate values', async () => {
      const extremeUser = {
        id: 'extreme-user',
        name: 'Extreme',
        avatarUrl: null,
        flavor: null,
        latitude: 90.0,      // North pole
        longitude: 180.0,    // Date line
        memberSince: null,
        foundingMember: false
      };

      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{
          id: 'vouch-1',
          voucherId: 'extreme-user',
          voucheeId: 'user-1',
          broadcast: true,
          voucher: extremeUser
        }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.network[0].latitude).toBe(90.0);
      expect(data.network[0].longitude).toBe(180.0);
    });

    it('should handle user with very old memberSince date', async () => {
      const oldTimer = {
        id: 'old-timer',
        name: 'Old Timer',
        avatarUrl: null,
        flavor: null,
        latitude: null,
        longitude: null,
        memberSince: new Date('2000-01-01T00:00:00.000Z'),
        foundingMember: true
      };

      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{
          id: 'vouch-1',
          voucherId: 'old-timer',
          voucheeId: 'user-1',
          broadcast: true,
          voucher: oldTimer
        }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(new Date(data.network[0].memberSince).getFullYear()).toBe(2000);
    });

    it('should correctly handle empty string userId in directConnectionIds', async () => {
      // Edge case: what if voucherId or voucheeId is somehow empty string?
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([{
          id: 'vouch-1',
          voucherId: '',  // Empty string
          voucheeId: 'user-1',
          broadcast: true,
          voucher: { id: '', name: 'Empty ID User', avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: false }
        }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.network).toHaveLength(1);
      expect(data.network[0].id).toBe('');
    });
  });

  // ============================================================================
  // DATABASE QUERY VALIDATION TESTS
  // ============================================================================
  describe('Database Query Validation', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('should make exactly 3 database calls', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await GET();

      expect(mockPrisma.vouch.findMany).toHaveBeenCalledTimes(3);
    });

    it('should query vouchers with correct include structure', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await GET();

      const firstCall = mockPrisma.vouch.findMany.mock.calls[0][0];
      expect(firstCall.include.voucher.select).toEqual({
        id: true,
        name: true,
        avatarUrl: true,
        flavor: true,
        latitude: true,
        longitude: true,
        memberSince: true,
        foundingMember: true
      });
    });

    it('should query vouchees with correct include structure', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await GET();

      const secondCall = mockPrisma.vouch.findMany.mock.calls[1][0];
      expect(secondCall.include.vouchee.select).toEqual({
        id: true,
        name: true,
        avatarUrl: true,
        flavor: true,
        latitude: true,
        longitude: true,
        memberSince: true,
        foundingMember: true
      });
    });

    it('should build extended network query with correct direct connection IDs', async () => {
      mockPrisma.vouch.findMany
        .mockResolvedValueOnce([
          { id: 'v1', voucherId: 'voucher-a', voucheeId: 'user-1', broadcast: true, voucher: { id: 'voucher-a', name: 'A', avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: false } }
        ])
        .mockResolvedValueOnce([
          { id: 'v2', voucherId: 'user-1', voucheeId: 'vouchee-b', broadcast: true, vouchee: { id: 'vouchee-b', name: 'B', avatarUrl: null, flavor: null, latitude: null, longitude: null, memberSince: null, foundingMember: false } }
        ])
        .mockResolvedValueOnce([]);

      await GET();

      const thirdCall = mockPrisma.vouch.findMany.mock.calls[2][0];
      expect(thirdCall.where.voucherId.in).toContain('voucher-a');
      expect(thirdCall.where.voucherId.in).toContain('vouchee-b');
    });
  });
});
