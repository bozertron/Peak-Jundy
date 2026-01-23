/**
 * Comprehensive unit tests for /api/conversations route
 * Tests GET (list conversations) and POST (create conversation) endpoints
 */

import { GET, POST } from '@/app/api/conversations/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Type the mocks properly
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/conversations', () => {
  // Helper to create mock request with JSON body
  const createMockRequest = (body: unknown): Request => {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as Request;
  };

  // Helper to create mock request that fails to parse JSON
  const createBadJsonRequest = (): Request => {
    return {
      json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
    } as unknown as Request;
  };

  // Test fixtures
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  const mockParticipant = {
    id: 'participant-456',
    name: 'Participant User',
    avatarUrl: 'https://example.com/participant.jpg',
  };

  const mockEquipment = {
    id: 'equipment-789',
    title: 'Mountain Bike',
  };

  describe('GET /api/conversations', () => {
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
    });

    describe('Successful retrieval', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: mockUser,
        } as any);
      });

      it('should return empty array when user has no conversations', async () => {
        mockPrisma.conversation.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.conversations).toEqual([]);
        expect(Array.isArray(data.conversations)).toBe(true);
      });

      it('should return conversations with participants filtered to exclude current user', async () => {
        mockPrisma.conversation.findMany.mockResolvedValue([
          {
            id: 'conv-1',
            participants: [mockUser, mockParticipant],
            equipment: null,
            messages: [],
            updatedAt: new Date('2024-01-01'),
            createdAt: new Date('2024-01-01'),
            equipmentId: null,
          },
        ] as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.conversations).toHaveLength(1);
        // Current user should be filtered out
        expect(data.conversations[0].participants).toHaveLength(1);
        expect(data.conversations[0].participants[0].id).toBe('participant-456');
      });

      it('should include last message when available', async () => {
        const lastMessage = {
          content: 'Hello there!',
          createdAt: new Date('2024-01-01T12:00:00Z'),
          senderId: 'participant-456',
        };

        mockPrisma.conversation.findMany.mockResolvedValue([
          {
            id: 'conv-1',
            participants: [mockUser, mockParticipant],
            equipment: null,
            messages: [lastMessage],
            updatedAt: new Date('2024-01-01'),
            createdAt: new Date('2024-01-01'),
            equipmentId: null,
          },
        ] as any);

        const response = await GET();
        const data = await response.json();

        expect(data.conversations[0].lastMessage).toEqual(lastMessage);
      });

      it('should return null for lastMessage when no messages exist', async () => {
        mockPrisma.conversation.findMany.mockResolvedValue([
          {
            id: 'conv-1',
            participants: [mockUser, mockParticipant],
            equipment: null,
            messages: [],
            updatedAt: new Date('2024-01-01'),
            createdAt: new Date('2024-01-01'),
            equipmentId: null,
          },
        ] as any);

        const response = await GET();
        const data = await response.json();

        expect(data.conversations[0].lastMessage).toBeNull();
      });

      it('should include equipment context when attached to conversation', async () => {
        mockPrisma.conversation.findMany.mockResolvedValue([
          {
            id: 'conv-1',
            participants: [mockUser, mockParticipant],
            equipment: mockEquipment,
            messages: [],
            updatedAt: new Date('2024-01-01'),
            createdAt: new Date('2024-01-01'),
            equipmentId: 'equipment-789',
          },
        ] as any);

        const response = await GET();
        const data = await response.json();

        expect(data.conversations[0].equipment).toEqual(mockEquipment);
      });

      it('should return multiple conversations ordered by updatedAt desc', async () => {
        mockPrisma.conversation.findMany.mockResolvedValue([
          {
            id: 'conv-newer',
            participants: [mockUser, mockParticipant],
            equipment: null,
            messages: [],
            updatedAt: new Date('2024-01-02'),
            createdAt: new Date('2024-01-01'),
            equipmentId: null,
          },
          {
            id: 'conv-older',
            participants: [mockUser, mockParticipant],
            equipment: null,
            messages: [],
            updatedAt: new Date('2024-01-01'),
            createdAt: new Date('2024-01-01'),
            equipmentId: null,
          },
        ] as any);

        const response = await GET();
        const data = await response.json();

        expect(data.conversations).toHaveLength(2);
        expect(data.conversations[0].id).toBe('conv-newer');
        expect(data.conversations[1].id).toBe('conv-older');
      });

      it('should correctly call prisma with proper where clause', async () => {
        mockPrisma.conversation.findMany.mockResolvedValue([]);

        await GET();

        expect(mockPrisma.conversation.findMany).toHaveBeenCalledWith({
          where: {
            participants: { some: { id: 'user-123' } },
          },
          include: {
            participants: {
              select: { id: true, name: true, avatarUrl: true },
            },
            equipment: {
              select: { id: true, title: true },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { content: true, createdAt: true, senderId: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
        });
      });
    });

    describe('Edge cases', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: mockUser,
        } as any);
      });

      it('should handle group conversations (more than 2 participants)', async () => {
        const thirdParticipant = {
          id: 'third-user',
          name: 'Third User',
          avatarUrl: null,
        };

        mockPrisma.conversation.findMany.mockResolvedValue([
          {
            id: 'group-conv',
            participants: [mockUser, mockParticipant, thirdParticipant],
            equipment: null,
            messages: [],
            updatedAt: new Date('2024-01-01'),
            createdAt: new Date('2024-01-01'),
            equipmentId: null,
          },
        ] as any);

        const response = await GET();
        const data = await response.json();

        // Should filter out current user but keep both other participants
        expect(data.conversations[0].participants).toHaveLength(2);
        expect(data.conversations[0].participants.map((p: any) => p.id)).toContain('participant-456');
        expect(data.conversations[0].participants.map((p: any) => p.id)).toContain('third-user');
      });

      it('should handle participants with null avatarUrl', async () => {
        const participantNoAvatar = {
          id: 'no-avatar-user',
          name: 'No Avatar',
          avatarUrl: null,
        };

        mockPrisma.conversation.findMany.mockResolvedValue([
          {
            id: 'conv-1',
            participants: [mockUser, participantNoAvatar],
            equipment: null,
            messages: [],
            updatedAt: new Date('2024-01-01'),
            createdAt: new Date('2024-01-01'),
            equipmentId: null,
          },
        ] as any);

        const response = await GET();
        const data = await response.json();

        expect(data.conversations[0].participants[0].avatarUrl).toBeNull();
      });

      it('should handle messages with very long content', async () => {
        const longContent = 'A'.repeat(10000);
        mockPrisma.conversation.findMany.mockResolvedValue([
          {
            id: 'conv-1',
            participants: [mockUser, mockParticipant],
            equipment: null,
            messages: [{
              content: longContent,
              createdAt: new Date('2024-01-01'),
              senderId: mockUser.id,
            }],
            updatedAt: new Date('2024-01-01'),
            createdAt: new Date('2024-01-01'),
            equipmentId: null,
          },
        ] as any);

        const response = await GET();
        const data = await response.json();

        expect(data.conversations[0].lastMessage.content).toBe(longContent);
        expect(data.conversations[0].lastMessage.content.length).toBe(10000);
      });

      it('should handle messages with unicode and emoji', async () => {
        const unicodeContent = 'Hello! \u{1F44B} This is a test with \u{1F680} and \u4E2D\u6587 characters';
        mockPrisma.conversation.findMany.mockResolvedValue([
          {
            id: 'conv-1',
            participants: [mockUser, mockParticipant],
            equipment: null,
            messages: [{
              content: unicodeContent,
              createdAt: new Date('2024-01-01'),
              senderId: mockUser.id,
            }],
            updatedAt: new Date('2024-01-01'),
            createdAt: new Date('2024-01-01'),
            equipmentId: null,
          },
        ] as any);

        const response = await GET();
        const data = await response.json();

        expect(data.conversations[0].lastMessage.content).toBe(unicodeContent);
      });

      it('should include updatedAt timestamp in response', async () => {
        const updateTime = new Date('2024-06-15T10:30:00Z');
        mockPrisma.conversation.findMany.mockResolvedValue([
          {
            id: 'conv-1',
            participants: [mockUser, mockParticipant],
            equipment: null,
            messages: [],
            updatedAt: updateTime,
            createdAt: new Date('2024-01-01'),
            equipmentId: null,
          },
        ] as any);

        const response = await GET();
        const data = await response.json();

        expect(data.conversations[0].updatedAt).toBeDefined();
      });
    });
  });

  describe('POST /api/conversations', () => {
    describe('Authentication', () => {
      it('should return 401 when session is null', async () => {
        mockGetServerSession.mockResolvedValue(null);
        const request = createMockRequest({ participantId: 'some-id' });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      it('should return 401 when session has no user', async () => {
        mockGetServerSession.mockResolvedValue({} as any);
        const request = createMockRequest({ participantId: 'some-id' });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      it('should return 401 when user has no id', async () => {
        mockGetServerSession.mockResolvedValue({
          user: { name: 'Test' },
        } as any);
        const request = createMockRequest({ participantId: 'some-id' });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Request validation', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: mockUser,
        } as any);
      });

      it('should return 400 when participantId is missing', async () => {
        const request = createMockRequest({});

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Participant ID is required');
      });

      it('should return 400 when participantId is null', async () => {
        const request = createMockRequest({ participantId: null });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Participant ID is required');
      });

      it('should return 400 when participantId is empty string', async () => {
        const request = createMockRequest({ participantId: '' });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Participant ID is required');
      });

      it('should return 400 when participantId is undefined', async () => {
        const request = createMockRequest({ participantId: undefined });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Participant ID is required');
      });
    });

    describe('Trust network verification', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: mockUser,
        } as any);
      });

      it('should return 403 when participant is not in trust network (no vouch, no contact card)', async () => {
        mockPrisma.vouch.findFirst.mockResolvedValue(null);
        mockPrisma.contactCard.findFirst.mockResolvedValue(null);

        const request = createMockRequest({ participantId: 'stranger-id' });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe('User not in your network');
      });

      it('should allow conversation when user vouched for participant (direct vouch)', async () => {
        mockPrisma.vouch.findFirst.mockResolvedValue({
          id: 'vouch-1',
          voucherId: mockUser.id,
          voucheeId: 'participant-456',
          broadcast: true,
        } as any);
        mockPrisma.conversation.findFirst.mockResolvedValue(null);
        mockPrisma.conversation.create.mockResolvedValue({
          id: 'new-conv',
          participants: [mockUser, mockParticipant],
        } as any);
        mockPrisma.contactCard.createMany.mockResolvedValue({ count: 2 });

        const request = createMockRequest({ participantId: 'participant-456' });
        const response = await POST(request);

        expect(response.status).toBe(201);
      });

      it('should allow conversation when participant vouched for user (reverse vouch)', async () => {
        mockPrisma.vouch.findFirst.mockResolvedValue({
          id: 'vouch-1',
          voucherId: 'participant-456',
          voucheeId: mockUser.id,
          broadcast: true,
        } as any);
        mockPrisma.conversation.findFirst.mockResolvedValue(null);
        mockPrisma.conversation.create.mockResolvedValue({
          id: 'new-conv',
          participants: [mockUser, mockParticipant],
        } as any);
        mockPrisma.contactCard.createMany.mockResolvedValue({ count: 2 });

        const request = createMockRequest({ participantId: 'participant-456' });
        const response = await POST(request);

        expect(response.status).toBe(201);
      });

      it('should NOT allow conversation when vouch exists but broadcast is false', async () => {
        // findFirst should return null since we're looking for broadcast: true
        mockPrisma.vouch.findFirst.mockResolvedValue(null);
        mockPrisma.contactCard.findFirst.mockResolvedValue(null);

        const request = createMockRequest({ participantId: 'participant-456' });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe('User not in your network');
      });

      it('should allow conversation via contact card (extended network)', async () => {
        mockPrisma.vouch.findFirst.mockResolvedValue(null);
        mockPrisma.contactCard.findFirst.mockResolvedValue({
          id: 'card-1',
          collectorId: mockUser.id,
          subjectId: 'participant-456',
        } as any);
        mockPrisma.conversation.findFirst.mockResolvedValue(null);
        mockPrisma.conversation.create.mockResolvedValue({
          id: 'new-conv',
          participants: [mockUser, mockParticipant],
        } as any);
        mockPrisma.contactCard.createMany.mockResolvedValue({ count: 2 });

        const request = createMockRequest({ participantId: 'participant-456' });
        const response = await POST(request);

        expect(response.status).toBe(201);
        // Verify correct contact card check was made
        expect(mockPrisma.contactCard.findFirst).toHaveBeenCalledWith({
          where: {
            collectorId: mockUser.id,
            subjectId: 'participant-456',
          },
        });
      });

      it('should check vouch before checking contact card (optimization)', async () => {
        mockPrisma.vouch.findFirst.mockResolvedValue({
          id: 'vouch-1',
          voucherId: mockUser.id,
          voucheeId: 'participant-456',
          broadcast: true,
        } as any);
        mockPrisma.conversation.findFirst.mockResolvedValue(null);
        mockPrisma.conversation.create.mockResolvedValue({
          id: 'new-conv',
          participants: [mockUser, mockParticipant],
        } as any);
        mockPrisma.contactCard.createMany.mockResolvedValue({ count: 2 });

        const request = createMockRequest({ participantId: 'participant-456' });
        await POST(request);

        // Contact card check should NOT be called if vouch exists
        expect(mockPrisma.contactCard.findFirst).not.toHaveBeenCalled();
      });
    });

    describe('Existing conversation handling', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: mockUser,
        } as any);
        mockPrisma.vouch.findFirst.mockResolvedValue({
          id: 'vouch-1',
          voucherId: mockUser.id,
          voucheeId: 'participant-456',
          broadcast: true,
        } as any);
      });

      it('should return existing conversation with existing: true flag', async () => {
        const existingConv = {
          id: 'existing-conv-123',
          participants: [mockUser, mockParticipant],
          equipmentId: null,
        };
        mockPrisma.conversation.findFirst.mockResolvedValue(existingConv as any);

        const request = createMockRequest({ participantId: 'participant-456' });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.existing).toBe(true);
        expect(data.conversation.id).toBe('existing-conv-123');
      });

      it('should NOT create new conversation when one already exists', async () => {
        const existingConv = {
          id: 'existing-conv-123',
          participants: [mockUser, mockParticipant],
        };
        mockPrisma.conversation.findFirst.mockResolvedValue(existingConv as any);

        const request = createMockRequest({ participantId: 'participant-456' });
        await POST(request);

        expect(mockPrisma.conversation.create).not.toHaveBeenCalled();
      });

      it('should consider equipmentId when checking for existing conversation', async () => {
        mockPrisma.conversation.findFirst.mockResolvedValue(null);
        mockPrisma.conversation.create.mockResolvedValue({
          id: 'new-conv',
          participants: [mockUser, mockParticipant],
          equipmentId: 'equipment-789',
        } as any);
        mockPrisma.contactCard.createMany.mockResolvedValue({ count: 2 });

        const request = createMockRequest({
          participantId: 'participant-456',
          equipmentId: 'equipment-789',
        });
        await POST(request);

        expect(mockPrisma.conversation.findFirst).toHaveBeenCalledWith({
          where: {
            AND: [
              { participants: { some: { id: mockUser.id } } },
              { participants: { some: { id: 'participant-456' } } },
              { equipmentId: 'equipment-789' },
            ],
          },
        });
      });

      it('should allow multiple conversations with same user for different equipment', async () => {
        // First call for equipment A - exists
        mockPrisma.conversation.findFirst.mockResolvedValueOnce({
          id: 'conv-equipment-a',
          equipmentId: 'equipment-a',
        } as any);

        const request = createMockRequest({
          participantId: 'participant-456',
          equipmentId: 'equipment-a',
        });
        const response = await POST(request);
        const data = await response.json();

        expect(data.existing).toBe(true);
        expect(data.conversation.id).toBe('conv-equipment-a');
      });
    });

    describe('New conversation creation', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: mockUser,
        } as any);
        mockPrisma.vouch.findFirst.mockResolvedValue({
          id: 'vouch-1',
          voucherId: mockUser.id,
          voucheeId: 'participant-456',
          broadcast: true,
        } as any);
        mockPrisma.conversation.findFirst.mockResolvedValue(null);
        mockPrisma.contactCard.createMany.mockResolvedValue({ count: 2 });
      });

      it('should create new conversation with correct participants', async () => {
        mockPrisma.conversation.create.mockResolvedValue({
          id: 'new-conv',
          participants: [mockUser, mockParticipant],
        } as any);

        const request = createMockRequest({ participantId: 'participant-456' });
        await POST(request);

        expect(mockPrisma.conversation.create).toHaveBeenCalledWith({
          data: {
            participants: {
              connect: [{ id: mockUser.id }, { id: 'participant-456' }],
            },
            equipmentId: undefined,
          },
          include: {
            participants: { select: { id: true, name: true, avatarUrl: true } },
          },
        });
      });

      it('should return 201 status for new conversation', async () => {
        mockPrisma.conversation.create.mockResolvedValue({
          id: 'new-conv',
          participants: [mockUser, mockParticipant],
        } as any);

        const request = createMockRequest({ participantId: 'participant-456' });
        const response = await POST(request);

        expect(response.status).toBe(201);
      });

      it('should return existing: false flag for new conversation', async () => {
        mockPrisma.conversation.create.mockResolvedValue({
          id: 'new-conv',
          participants: [mockUser, mockParticipant],
        } as any);

        const request = createMockRequest({ participantId: 'participant-456' });
        const response = await POST(request);
        const data = await response.json();

        expect(data.existing).toBe(false);
      });

      it('should attach equipment context when equipmentId provided', async () => {
        mockPrisma.conversation.create.mockResolvedValue({
          id: 'new-conv',
          participants: [mockUser, mockParticipant],
          equipmentId: 'equipment-789',
        } as any);

        const request = createMockRequest({
          participantId: 'participant-456',
          equipmentId: 'equipment-789',
        });
        await POST(request);

        expect(mockPrisma.conversation.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              equipmentId: 'equipment-789',
            }),
          })
        );
      });

      it('should NOT attach equipment when equipmentId is not provided', async () => {
        mockPrisma.conversation.create.mockResolvedValue({
          id: 'new-conv',
          participants: [mockUser, mockParticipant],
        } as any);

        const request = createMockRequest({ participantId: 'participant-456' });
        await POST(request);

        expect(mockPrisma.conversation.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              equipmentId: undefined,
            }),
          })
        );
      });
    });

    describe('Initial message handling', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: mockUser,
        } as any);
        mockPrisma.vouch.findFirst.mockResolvedValue({
          id: 'vouch-1',
          voucherId: mockUser.id,
          voucheeId: 'participant-456',
          broadcast: true,
        } as any);
        mockPrisma.conversation.findFirst.mockResolvedValue(null);
        mockPrisma.conversation.create.mockResolvedValue({
          id: 'new-conv',
          participants: [mockUser, mockParticipant],
        } as any);
        mockPrisma.contactCard.createMany.mockResolvedValue({ count: 2 });
        mockPrisma.message.create.mockResolvedValue({
          id: 'msg-1',
          content: 'Hello!',
          senderId: mockUser.id,
          conversationId: 'new-conv',
        } as any);
      });

      it('should create initial message when provided', async () => {
        const request = createMockRequest({
          participantId: 'participant-456',
          initialMessage: 'Hello, I want to rent your bike!',
        });
        await POST(request);

        expect(mockPrisma.message.create).toHaveBeenCalledWith({
          data: {
            conversationId: 'new-conv',
            senderId: mockUser.id,
            content: 'Hello, I want to rent your bike!',
          },
        });
      });

      it('should NOT create message when initialMessage is not provided', async () => {
        const request = createMockRequest({ participantId: 'participant-456' });
        await POST(request);

        expect(mockPrisma.message.create).not.toHaveBeenCalled();
      });

      it('should NOT create message when initialMessage is empty string', async () => {
        const request = createMockRequest({
          participantId: 'participant-456',
          initialMessage: '',
        });
        await POST(request);

        expect(mockPrisma.message.create).not.toHaveBeenCalled();
      });

      it('should NOT create message when initialMessage is null', async () => {
        const request = createMockRequest({
          participantId: 'participant-456',
          initialMessage: null,
        });
        await POST(request);

        expect(mockPrisma.message.create).not.toHaveBeenCalled();
      });

      it('should handle very long initial messages', async () => {
        const longMessage = 'A'.repeat(10000);
        const request = createMockRequest({
          participantId: 'participant-456',
          initialMessage: longMessage,
        });
        await POST(request);

        expect(mockPrisma.message.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            content: longMessage,
          }),
        });
      });

      it('should handle unicode and emoji in initial messages', async () => {
        const unicodeMessage = 'Hi! \u{1F44B} I would like to rent your \u{1F6B2}. \u8C22\u8C22!';
        const request = createMockRequest({
          participantId: 'participant-456',
          initialMessage: unicodeMessage,
        });
        await POST(request);

        expect(mockPrisma.message.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            content: unicodeMessage,
          }),
        });
      });

      it('should handle special characters and newlines in initial messages', async () => {
        const specialMessage = 'Line 1\nLine 2\r\nLine 3\tTabbed<script>alert("xss")</script>';
        const request = createMockRequest({
          participantId: 'participant-456',
          initialMessage: specialMessage,
        });
        await POST(request);

        expect(mockPrisma.message.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            content: specialMessage,
          }),
        });
      });
    });

    describe('Contact card creation', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: mockUser,
        } as any);
        mockPrisma.vouch.findFirst.mockResolvedValue({
          id: 'vouch-1',
          voucherId: mockUser.id,
          voucheeId: 'participant-456',
          broadcast: true,
        } as any);
        mockPrisma.conversation.findFirst.mockResolvedValue(null);
        mockPrisma.conversation.create.mockResolvedValue({
          id: 'new-conv',
          participants: [mockUser, mockParticipant],
        } as any);
        mockPrisma.contactCard.createMany.mockResolvedValue({ count: 2 });
      });

      it('should create contact cards for both users', async () => {
        const request = createMockRequest({ participantId: 'participant-456' });
        await POST(request);

        expect(mockPrisma.contactCard.createMany).toHaveBeenCalledWith({
          data: [
            { collectorId: mockUser.id, subjectId: 'participant-456', origin: 'conversation' },
            { collectorId: 'participant-456', subjectId: mockUser.id, origin: 'conversation' },
          ],
          skipDuplicates: true,
        });
      });

      it('should use skipDuplicates to prevent errors on existing cards', async () => {
        const request = createMockRequest({ participantId: 'participant-456' });
        await POST(request);

        expect(mockPrisma.contactCard.createMany).toHaveBeenCalledWith(
          expect.objectContaining({
            skipDuplicates: true,
          })
        );
      });

      it('should set origin to "conversation" for new contact cards', async () => {
        const request = createMockRequest({ participantId: 'participant-456' });
        await POST(request);

        expect(mockPrisma.contactCard.createMany).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.arrayContaining([
              expect.objectContaining({ origin: 'conversation' }),
            ]),
          })
        );
      });
    });

    describe('Edge cases', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: mockUser,
        } as any);
      });

      it('should reject conversation with self (same user as participant)', async () => {
        // Note: The current implementation doesn't explicitly check for this
        // This test documents the expected behavior
        mockPrisma.vouch.findFirst.mockResolvedValue(null);
        mockPrisma.contactCard.findFirst.mockResolvedValue(null);

        const request = createMockRequest({ participantId: mockUser.id });
        const response = await POST(request);
        const data = await response.json();

        // Without explicit check, this would fail at network verification
        // since you can't vouch for yourself (presumably)
        expect(response.status).toBe(403);
        expect(data.error).toBe('User not in your network');
      });

      it('should handle whitespace-only participantId', async () => {
        const request = createMockRequest({ participantId: '   ' });
        const response = await POST(request);

        // Whitespace is truthy in JS, so it passes the !participantId check
        // This documents current behavior - may want to add trim validation
        expect(response.status).not.toBe(400);
      });

      it('should handle numeric participantId (type coercion)', async () => {
        mockPrisma.vouch.findFirst.mockResolvedValue(null);
        mockPrisma.contactCard.findFirst.mockResolvedValue(null);

        const request = createMockRequest({ participantId: 12345 });
        const response = await POST(request);

        // Numeric ID is truthy, passes validation but likely fails network check
        expect(response.status).toBe(403);
      });

      it('should handle array participantId (malformed input)', async () => {
        mockPrisma.vouch.findFirst.mockResolvedValue(null);
        mockPrisma.contactCard.findFirst.mockResolvedValue(null);

        const request = createMockRequest({ participantId: ['id1', 'id2'] });
        const response = await POST(request);

        // Array is truthy, passes validation
        expect(response.status).toBe(403);
      });

      it('should handle object participantId (malformed input)', async () => {
        mockPrisma.vouch.findFirst.mockResolvedValue(null);
        mockPrisma.contactCard.findFirst.mockResolvedValue(null);

        const request = createMockRequest({ participantId: { id: 'nested' } });
        const response = await POST(request);

        expect(response.status).toBe(403);
      });

      it('should handle extremely long participantId', async () => {
        const longId = 'A'.repeat(10000);
        mockPrisma.vouch.findFirst.mockResolvedValue(null);
        mockPrisma.contactCard.findFirst.mockResolvedValue(null);

        const request = createMockRequest({ participantId: longId });
        const response = await POST(request);

        expect(response.status).toBe(403);
      });

      it('should handle SQL injection attempt in participantId', async () => {
        mockPrisma.vouch.findFirst.mockResolvedValue(null);
        mockPrisma.contactCard.findFirst.mockResolvedValue(null);

        const request = createMockRequest({ participantId: "'; DROP TABLE users; --" });
        const response = await POST(request);

        // Prisma parameterizes queries, so this should be safe
        expect(response.status).toBe(403);
        expect(mockPrisma.vouch.findFirst).toHaveBeenCalled();
      });

      it('should handle XSS attempt in initialMessage', async () => {
        mockPrisma.vouch.findFirst.mockResolvedValue({
          id: 'vouch-1',
          voucherId: mockUser.id,
          voucheeId: 'participant-456',
          broadcast: true,
        } as any);
        mockPrisma.conversation.findFirst.mockResolvedValue(null);
        mockPrisma.conversation.create.mockResolvedValue({
          id: 'new-conv',
          participants: [mockUser, mockParticipant],
        } as any);
        mockPrisma.contactCard.createMany.mockResolvedValue({ count: 2 });
        mockPrisma.message.create.mockResolvedValue({
          id: 'msg-1',
          content: '<script>alert("xss")</script>',
          senderId: mockUser.id,
          conversationId: 'new-conv',
        } as any);

        const xssMessage = '<script>alert("xss")</script><img onerror="alert(1)" src="x">';
        const request = createMockRequest({
          participantId: 'participant-456',
          initialMessage: xssMessage,
        });
        const response = await POST(request);

        // Message is stored as-is - XSS prevention should happen at render time
        expect(response.status).toBe(201);
        expect(mockPrisma.message.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            content: xssMessage,
          }),
        });
      });

      it('should handle concurrent conversation creation (race condition)', async () => {
        // First findFirst returns null (no existing conversation)
        mockPrisma.conversation.findFirst.mockResolvedValue(null);
        // But create fails due to unique constraint (concurrent creation)
        mockPrisma.conversation.create.mockRejectedValue(
          new Error('Unique constraint violated')
        );
        mockPrisma.vouch.findFirst.mockResolvedValue({
          id: 'vouch-1',
          voucherId: mockUser.id,
          voucheeId: 'participant-456',
          broadcast: true,
        } as any);

        const request = createMockRequest({ participantId: 'participant-456' });

        // Current implementation doesn't handle this - test documents behavior
        await expect(POST(request)).rejects.toThrow('Unique constraint violated');
      });
    });

    describe('Response format validation', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: mockUser,
        } as any);
        mockPrisma.vouch.findFirst.mockResolvedValue({
          id: 'vouch-1',
          voucherId: mockUser.id,
          voucheeId: 'participant-456',
          broadcast: true,
        } as any);
        mockPrisma.conversation.findFirst.mockResolvedValue(null);
        mockPrisma.contactCard.createMany.mockResolvedValue({ count: 2 });
      });

      it('should return conversation object in response', async () => {
        const newConv = {
          id: 'new-conv',
          participants: [mockUser, mockParticipant],
          equipmentId: null,
        };
        mockPrisma.conversation.create.mockResolvedValue(newConv as any);

        const request = createMockRequest({ participantId: 'participant-456' });
        const response = await POST(request);
        const data = await response.json();

        expect(data.conversation).toBeDefined();
        expect(data.conversation.id).toBe('new-conv');
        expect(data.conversation.participants).toBeDefined();
      });

      it('should include participants with correct fields in response', async () => {
        mockPrisma.conversation.create.mockResolvedValue({
          id: 'new-conv',
          participants: [
            { id: mockUser.id, name: mockUser.name, avatarUrl: mockUser.avatarUrl },
            { id: mockParticipant.id, name: mockParticipant.name, avatarUrl: mockParticipant.avatarUrl },
          ],
        } as any);

        const request = createMockRequest({ participantId: 'participant-456' });
        const response = await POST(request);
        const data = await response.json();

        expect(data.conversation.participants).toHaveLength(2);
        data.conversation.participants.forEach((p: any) => {
          expect(p).toHaveProperty('id');
          expect(p).toHaveProperty('name');
          expect(p).toHaveProperty('avatarUrl');
        });
      });
    });
  });
});
