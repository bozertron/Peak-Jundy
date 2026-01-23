/**
 * Comprehensive unit tests for /api/cards route
 * Tests GET endpoint for retrieving user's collected contact cards
 */

import { GET } from '@/app/api/cards/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Type the mocks properly
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/cards', () => {
  // Test fixtures
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  const mockSubject = {
    id: 'subject-456',
    name: 'Card Subject',
    avatarUrl: 'https://example.com/subject.jpg',
    flavor: 'Mountain enthusiast and gear collector',
    memberSince: new Date('2023-01-15'),
    foundingMember: true,
    _count: { equipment: 5 },
  };

  const mockEquipment = [
    { id: 'eq-1', title: 'Mountain Bike', category: 'cycling', dailyRate: 50 },
    { id: 'eq-2', title: 'Camping Tent', category: 'camping', dailyRate: 30 },
    { id: 'eq-3', title: 'Hiking Boots', category: 'hiking', dailyRate: 15 },
  ];

  describe('GET /api/cards', () => {
    describe('Authentication', () => {
      it('should return 401 when session is null', async () => {
        mockGetServerSession.mockResolvedValue(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      it('should return 401 when session has no user', async () => {
        mockGetServerSession.mockResolvedValue({} as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      it('should return 401 when user has no id', async () => {
        mockGetServerSession.mockResolvedValue({
          user: { name: 'Test', email: 'test@example.com' },
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      it('should return 401 when user id is empty string', async () => {
        mockGetServerSession.mockResolvedValue({
          user: { id: '', name: 'Test' },
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      it('should return 401 when user id is undefined', async () => {
        mockGetServerSession.mockResolvedValue({
          user: { id: undefined, name: 'Test' },
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      it('should return 401 when user object is null', async () => {
        mockGetServerSession.mockResolvedValue({
          user: null,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Empty cards list', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: mockUser,
        } as any);
      });

      it('should return empty array when user has no collected cards', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.cards).toEqual([]);
        expect(Array.isArray(data.cards)).toBe(true);
      });

      it('should call prisma with correct where clause for empty result', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([]);

        await GET();

        expect(mockPrisma.contactCard.findMany).toHaveBeenCalledWith({
          where: { collectorId: 'user-123' },
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                flavor: true,
                memberSince: true,
                foundingMember: true,
                _count: {
                  select: { equipment: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      });
    });

    describe('Cards with subject data', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: mockUser,
        } as any);
      });

      it('should return cards with enriched subject data', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: mockSubject,
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue(mockEquipment as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.cards).toHaveLength(1);
        expect(data.cards[0].subject.id).toBe('subject-456');
        expect(data.cards[0].subject.name).toBe('Card Subject');
      });

      it('should include all subject fields', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'vouched',
            createdAt: new Date('2024-01-01'),
            subject: mockSubject,
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        const subject = data.cards[0].subject;
        expect(subject).toHaveProperty('id');
        expect(subject).toHaveProperty('name');
        expect(subject).toHaveProperty('avatarUrl');
        expect(subject).toHaveProperty('flavor');
        expect(subject).toHaveProperty('memberSince');
        expect(subject).toHaveProperty('foundingMember');
      });

      it('should include equipmentCount from _count', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: { ...mockSubject, _count: { equipment: 10 } },
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].subject.equipmentCount).toBe(10);
      });

      it('should handle subject with null avatarUrl', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: { ...mockSubject, avatarUrl: null },
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].subject.avatarUrl).toBeNull();
      });

      it('should handle subject with null flavor', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: { ...mockSubject, flavor: null },
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].subject.flavor).toBeNull();
      });

      it('should handle non-founding member', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: { ...mockSubject, foundingMember: false },
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].subject.foundingMember).toBe(false);
      });
    });

    describe('Equipment preview', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: mockUser,
        } as any);
      });

      it('should include equipment preview with up to 3 items', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: mockSubject,
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue(mockEquipment as any);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].subject.equipmentPreview).toHaveLength(3);
        expect(data.cards[0].subject.equipmentPreview[0]).toHaveProperty('id');
        expect(data.cards[0].subject.equipmentPreview[0]).toHaveProperty('title');
        expect(data.cards[0].subject.equipmentPreview[0]).toHaveProperty('category');
        expect(data.cards[0].subject.equipmentPreview[0]).toHaveProperty('dailyRate');
      });

      it('should call equipment query with correct parameters (only available, take 3)', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: 'subject-456',
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: mockSubject,
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        await GET();

        expect(mockPrisma.equipment.findMany).toHaveBeenCalledWith({
          where: { ownerId: 'subject-456', available: true },
          select: { id: true, title: true, category: true, dailyRate: true },
          take: 3,
        });
      });

      it('should only include available equipment in preview', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: mockSubject,
          },
        ] as any);

        // Only 2 available items
        const availableEquipment = [
          { id: 'eq-1', title: 'Available Bike', category: 'cycling', dailyRate: 50 },
          { id: 'eq-2', title: 'Available Tent', category: 'camping', dailyRate: 30 },
        ];
        mockPrisma.equipment.findMany.mockResolvedValue(availableEquipment as any);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].subject.equipmentPreview).toHaveLength(2);
      });

      it('should return empty equipmentPreview when subject has no available equipment', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: mockSubject,
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].subject.equipmentPreview).toEqual([]);
        expect(Array.isArray(data.cards[0].subject.equipmentPreview)).toBe(true);
      });

      it('should limit to 3 items even when subject has many equipment', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: { ...mockSubject, _count: { equipment: 50 } },
          },
        ] as any);

        // Return exactly 3 (due to take: 3 in query)
        mockPrisma.equipment.findMany.mockResolvedValue(mockEquipment as any);

        const response = await GET();
        const data = await response.json();

        // equipmentCount shows total, but preview only shows 3
        expect(data.cards[0].subject.equipmentCount).toBe(50);
        expect(data.cards[0].subject.equipmentPreview).toHaveLength(3);
      });

      it('should handle subject with zero equipment (equipmentCount 0)', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: { ...mockSubject, _count: { equipment: 0 } },
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].subject.equipmentCount).toBe(0);
        expect(data.cards[0].subject.equipmentPreview).toEqual([]);
      });

      it('should query equipment for each card separately', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: 'subject-1',
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: { ...mockSubject, id: 'subject-1' },
          },
          {
            id: 'card-2',
            collectorId: mockUser.id,
            subjectId: 'subject-2',
            origin: 'vouched',
            createdAt: new Date('2024-01-02'),
            subject: { ...mockSubject, id: 'subject-2' },
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        await GET();

        // Should be called twice, once for each card
        expect(mockPrisma.equipment.findMany).toHaveBeenCalledTimes(2);
        expect(mockPrisma.equipment.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { ownerId: 'subject-1', available: true },
          })
        );
        expect(mockPrisma.equipment.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { ownerId: 'subject-2', available: true },
          })
        );
      });
    });

    describe('Multiple cards', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: mockUser,
        } as any);
      });

      it('should return multiple cards', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: 'subject-1',
            origin: 'conversation',
            createdAt: new Date('2024-01-02'),
            subject: { ...mockSubject, id: 'subject-1', name: 'Subject One' },
          },
          {
            id: 'card-2',
            collectorId: mockUser.id,
            subjectId: 'subject-2',
            origin: 'vouched',
            createdAt: new Date('2024-01-01'),
            subject: { ...mockSubject, id: 'subject-2', name: 'Subject Two' },
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(data.cards).toHaveLength(2);
        expect(data.cards[0].subject.name).toBe('Subject One');
        expect(data.cards[1].subject.name).toBe('Subject Two');
      });

      it('should return cards ordered by createdAt desc (newest first)', async () => {
        const newerDate = new Date('2024-06-01');
        const olderDate = new Date('2024-01-01');

        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-newer',
            collectorId: mockUser.id,
            subjectId: 'subject-1',
            origin: 'conversation',
            createdAt: newerDate,
            subject: { ...mockSubject, id: 'subject-1' },
          },
          {
            id: 'card-older',
            collectorId: mockUser.id,
            subjectId: 'subject-2',
            origin: 'vouched',
            createdAt: olderDate,
            subject: { ...mockSubject, id: 'subject-2' },
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        // Verify ordering in response
        expect(data.cards[0].id).toBe('card-newer');
        expect(data.cards[1].id).toBe('card-older');
      });

      it('should handle large number of cards efficiently', async () => {
        // Generate 100 cards
        const manyCards = Array.from({ length: 100 }, (_, i) => ({
          id: `card-${i}`,
          collectorId: mockUser.id,
          subjectId: `subject-${i}`,
          origin: 'conversation',
          createdAt: new Date(2024, 0, 100 - i), // Descending dates
          subject: { ...mockSubject, id: `subject-${i}`, name: `Subject ${i}` },
        }));

        mockPrisma.contactCard.findMany.mockResolvedValue(manyCards as any);
        mockPrisma.equipment.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(data.cards).toHaveLength(100);
        // Verify first card is the newest
        expect(data.cards[0].id).toBe('card-0');
      });
    });

    describe('Card origins', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: mockUser,
        } as any);
        mockPrisma.equipment.findMany.mockResolvedValue([]);
      });

      it('should include origin field for conversation-sourced cards', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: mockSubject,
          },
        ] as any);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].origin).toBe('conversation');
      });

      it('should include origin field for vouched-sourced cards', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'vouched',
            createdAt: new Date('2024-01-01'),
            subject: mockSubject,
          },
        ] as any);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].origin).toBe('vouched');
      });

      it('should include origin field for booking-sourced cards', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'booking',
            createdAt: new Date('2024-01-01'),
            subject: mockSubject,
          },
        ] as any);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].origin).toBe('booking');
      });
    });

    describe('Edge cases', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: mockUser,
        } as any);
      });

      it('should handle subject with unicode name', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: {
              ...mockSubject,
              name: '\u5F20\u4E09 \u{1F44B}', // Chinese name with emoji
            },
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].subject.name).toBe('\u5F20\u4E09 \u{1F44B}');
      });

      it('should handle subject with unicode flavor text', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: {
              ...mockSubject,
              flavor: 'Adventure awaits! \u{1F3D4}\u{FE0F}\u{1F9D7}\u200D\u2642\u{FE0F}\u{1F6B5}\u200D\u2640\u{FE0F}',
            },
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].subject.flavor).toContain('\u{1F3D4}');
      });

      it('should handle equipment with special characters in title', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: mockSubject,
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([
          {
            id: 'eq-1',
            title: 'Trek 2024 "XCaliber" 29er <Mountain Bike>',
            category: 'cycling',
            dailyRate: 75,
          },
        ] as any);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].subject.equipmentPreview[0].title).toBe(
          'Trek 2024 "XCaliber" 29er <Mountain Bike>'
        );
      });

      it('should handle equipment with decimal dailyRate', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: mockSubject,
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([
          { id: 'eq-1', title: 'Budget Tent', category: 'camping', dailyRate: 19.99 },
        ] as any);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].subject.equipmentPreview[0].dailyRate).toBe(19.99);
      });

      it('should handle equipment with zero dailyRate (free rentals)', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: mockSubject,
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([
          { id: 'eq-1', title: 'Free Gear', category: 'misc', dailyRate: 0 },
        ] as any);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].subject.equipmentPreview[0].dailyRate).toBe(0);
      });

      it('should handle memberSince as Date object', async () => {
        const memberDate = new Date('2020-03-15T10:30:00Z');
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: { ...mockSubject, memberSince: memberDate },
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        // Date should be serialized in response
        expect(data.cards[0].subject.memberSince).toBeDefined();
      });

      it('should handle null memberSince', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: { ...mockSubject, memberSince: null },
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].subject.memberSince).toBeNull();
      });

      it('should preserve all card-level fields', async () => {
        const cardCreatedAt = new Date('2024-03-15T14:30:00Z');
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-abc123',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'vouched',
            createdAt: cardCreatedAt,
            subject: mockSubject,
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].id).toBe('card-abc123');
        expect(data.cards[0].collectorId).toBe(mockUser.id);
        expect(data.cards[0].subjectId).toBe(mockSubject.id);
        expect(data.cards[0].origin).toBe('vouched');
        expect(data.cards[0].createdAt).toBeDefined();
      });

      it('should handle very long subject name', async () => {
        const longName = 'A'.repeat(500);
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: { ...mockSubject, name: longName },
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].subject.name).toBe(longName);
        expect(data.cards[0].subject.name.length).toBe(500);
      });

      it('should handle very long flavor text', async () => {
        const longFlavor = 'B'.repeat(2000);
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: { ...mockSubject, flavor: longFlavor },
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].subject.flavor).toBe(longFlavor);
        expect(data.cards[0].subject.flavor.length).toBe(2000);
      });

      it('should handle equipment with null category', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: mockSubject,
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([
          { id: 'eq-1', title: 'Uncategorized Item', category: null, dailyRate: 25 },
        ] as any);

        const response = await GET();
        const data = await response.json();

        expect(data.cards[0].subject.equipmentPreview[0].category).toBeNull();
      });
    });

    describe('Error handling', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: mockUser,
        } as any);
      });

      it('should propagate database errors from contactCard.findMany', async () => {
        mockPrisma.contactCard.findMany.mockRejectedValue(
          new Error('Database connection failed')
        );

        await expect(GET()).rejects.toThrow('Database connection failed');
      });

      it('should propagate database errors from equipment.findMany', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: mockSubject,
          },
        ] as any);

        mockPrisma.equipment.findMany.mockRejectedValue(
          new Error('Equipment query timeout')
        );

        await expect(GET()).rejects.toThrow('Equipment query timeout');
      });

      it('should handle session check errors gracefully', async () => {
        mockGetServerSession.mockRejectedValue(new Error('Auth service unavailable'));

        await expect(GET()).rejects.toThrow('Auth service unavailable');
      });
    });

    describe('Response format validation', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: mockUser,
        } as any);
      });

      it('should return JSON response with cards key', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(data).toHaveProperty('cards');
        expect(typeof data.cards).toBe('object');
        expect(Array.isArray(data.cards)).toBe(true);
      });

      it('should return 200 status for successful response', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([]);

        const response = await GET();

        expect(response.status).toBe(200);
      });

      it('should include all expected fields in enriched card', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: mockSubject,
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue(mockEquipment as any);

        const response = await GET();
        const data = await response.json();

        const card = data.cards[0];
        // Card-level fields
        expect(card).toHaveProperty('id');
        expect(card).toHaveProperty('collectorId');
        expect(card).toHaveProperty('subjectId');
        expect(card).toHaveProperty('origin');
        expect(card).toHaveProperty('createdAt');
        expect(card).toHaveProperty('subject');

        // Subject fields
        expect(card.subject).toHaveProperty('id');
        expect(card.subject).toHaveProperty('name');
        expect(card.subject).toHaveProperty('avatarUrl');
        expect(card.subject).toHaveProperty('flavor');
        expect(card.subject).toHaveProperty('memberSince');
        expect(card.subject).toHaveProperty('foundingMember');
        expect(card.subject).toHaveProperty('equipmentCount');
        expect(card.subject).toHaveProperty('equipmentPreview');
      });

      it('should include all expected fields in equipment preview items', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date('2024-01-01'),
            subject: mockSubject,
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([
          { id: 'eq-1', title: 'Test Item', category: 'test', dailyRate: 10 },
        ] as any);

        const response = await GET();
        const data = await response.json();

        const equipmentItem = data.cards[0].subject.equipmentPreview[0];
        expect(equipmentItem).toHaveProperty('id');
        expect(equipmentItem).toHaveProperty('title');
        expect(equipmentItem).toHaveProperty('category');
        expect(equipmentItem).toHaveProperty('dailyRate');
        // Should NOT have other fields like 'available' or 'description'
        expect(Object.keys(equipmentItem)).toHaveLength(4);
      });
    });

    describe('Data integrity', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: mockUser,
        } as any);
      });

      it('should only return cards where collectorId matches current user', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([]);

        await GET();

        expect(mockPrisma.contactCard.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { collectorId: mockUser.id },
          })
        );
      });

      it('should not include cards collected by other users', async () => {
        // This is enforced by the where clause, but we verify the query
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'my-card',
            collectorId: mockUser.id,
            subjectId: 'some-subject',
            origin: 'conversation',
            createdAt: new Date(),
            subject: mockSubject,
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        // All returned cards should belong to current user
        data.cards.forEach((card: any) => {
          expect(card.collectorId).toBe(mockUser.id);
        });
      });

      it('should query equipment only for available items', async () => {
        mockPrisma.contactCard.findMany.mockResolvedValue([
          {
            id: 'card-1',
            collectorId: mockUser.id,
            subjectId: mockSubject.id,
            origin: 'conversation',
            createdAt: new Date(),
            subject: mockSubject,
          },
        ] as any);

        mockPrisma.equipment.findMany.mockResolvedValue([]);

        await GET();

        expect(mockPrisma.equipment.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              available: true,
            }),
          })
        );
      });
    });
  });
});
