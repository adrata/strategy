/**
 * Reminders API Integration Tests
 * 
 * Comprehensive tests for reminder CRUD operations
 */

// Mock Next.js Response
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: new Headers(),
    })),
  },
}));

// Mock the auth function
jest.mock('@/platform/services/secure-api-helper', () => ({
  getSecureApiContext: jest.fn().mockResolvedValue({
    context: {
      userId: '01K1VBYZG41K9QA0D9CF06KNRG',
      userEmail: 'ross@adrata.com',
      workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
      userName: 'Ross',
    },
    response: undefined,
  }),
}));

// Mock Prisma
const mockReminder = {
  id: 'reminder-1',
  workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
  userId: '01K1VBYZG41K9QA0D9CF06KNRG',
  entityType: 'people',
  entityId: 'person-1',
  reminderAt: new Date('2024-01-16T14:30:00Z'),
  note: 'Follow up on proposal',
  isCompleted: false,
  completedAt: null,
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:00:00Z'),
  deletedAt: null,
};

const mockPerson = {
  id: 'person-1',
  workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
  fullName: 'John Doe',
  name: 'John Doe',
  deletedAt: null,
};

const mockCompany = {
  id: 'company-1',
  workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
  name: 'Acme Corp',
  deletedAt: null,
};

jest.mock('@/lib/prisma', () => ({
  prisma: {
    reminders: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    people: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    companies: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { POST, GET } from '@/app/api/v1/reminders/route';
import { PATCH, DELETE } from '@/app/api/v1/reminders/[id]/route';
import { prisma } from '@/lib/prisma';

describe('Reminders API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/reminders', () => {
    it('should create a reminder for a person', async () => {
      (prisma.people.findFirst as jest.Mock).mockResolvedValue(mockPerson);
      (prisma.reminders.create as jest.Mock).mockResolvedValue(mockReminder);

      // Use a date in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const request = new Request('http://localhost:3000/api/v1/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          entityType: 'people',
          entityId: 'person-1',
          reminderAt: futureDate.toISOString(),
          note: 'Follow up on proposal',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        entityType: 'people',
        entityId: 'person-1',
        note: 'Follow up on proposal',
      });
      expect(prisma.reminders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: 'people',
            entityId: 'person-1',
            note: 'Follow up on proposal',
          }),
        })
      );
    });

    it('should create a reminder for a company', async () => {
      (prisma.companies.findFirst as jest.Mock).mockResolvedValue(mockCompany);
      (prisma.reminders.create as jest.Mock).mockResolvedValue({
        ...mockReminder,
        entityType: 'companies',
        entityId: 'company-1',
      });

      // Use a date in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const request = new Request('http://localhost:3000/api/v1/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          entityType: 'companies',
          entityId: 'company-1',
          reminderAt: futureDate.toISOString(),
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.entityType).toBe('companies');
    });

    it('should reject reminder in the past', async () => {
      const request = new Request('http://localhost:3000/api/v1/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          entityType: 'people',
          entityId: 'person-1',
          reminderAt: '2024-01-14T10:00:00Z', // Past date
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('must be in the future');
    });

    it('should reject invalid entityType', async () => {
      const request = new Request('http://localhost:3000/api/v1/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          entityType: 'invalid',
          entityId: 'person-1',
          reminderAt: '2024-01-16T14:30:00Z',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('entityType must be');
    });

    it('should reject missing required fields', async () => {
      const request = new Request('http://localhost:3000/api/v1/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          entityType: 'people',
          // Missing entityId and reminderAt
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should reject if entity does not exist', async () => {
      (prisma.people.findFirst as jest.Mock).mockResolvedValue(null);

      // Use a date far in the future to ensure it passes date validation
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const request = new Request('http://localhost:3000/api/v1/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          entityType: 'people',
          entityId: 'nonexistent',
          reminderAt: futureDate.toISOString(),
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });
  });

  describe('GET /api/v1/reminders', () => {
    it('should fetch reminders for the current user', async () => {
      (prisma.reminders.findMany as jest.Mock).mockResolvedValue([mockReminder]);

      const request = new Request('http://localhost:3000/api/v1/reminders', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(prisma.reminders.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
            userId: '01K1VBYZG41K9QA0D9CF06KNRG',
          }),
        })
      );
    });

    it('should filter reminders by entityType', async () => {
      (prisma.reminders.findMany as jest.Mock).mockResolvedValue([mockReminder]);

      const request = new Request('http://localhost:3000/api/v1/reminders?entityType=people', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.reminders.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityType: 'people',
          }),
        })
      );
    });

    it('should filter reminders by isCompleted', async () => {
      (prisma.reminders.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/v1/reminders?isCompleted=false', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.reminders.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isCompleted: false,
          }),
        })
      );
    });
  });

  describe('PATCH /api/v1/reminders/[id]', () => {
    it('should mark reminder as completed', async () => {
      (prisma.reminders.findFirst as jest.Mock).mockResolvedValue(mockReminder);
      (prisma.reminders.update as jest.Mock).mockResolvedValue({
        ...mockReminder,
        isCompleted: true,
        completedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/v1/reminders/reminder-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          isCompleted: true,
        }),
      });

      const response = await PATCH(request, { params: { id: 'reminder-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.isCompleted).toBe(true);
      expect(prisma.reminders.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'reminder-1' },
          data: expect.objectContaining({
            isCompleted: true,
          }),
        })
      );
    });

    it('should update reminder note', async () => {
      (prisma.reminders.findFirst as jest.Mock).mockResolvedValue(mockReminder);
      (prisma.reminders.update as jest.Mock).mockResolvedValue({
        ...mockReminder,
        note: 'Updated note',
      });

      const request = new Request('http://localhost:3000/api/v1/reminders/reminder-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          note: 'Updated note',
        }),
      });

      const response = await PATCH(request, { params: { id: 'reminder-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.note).toBe('Updated note');
    });

    it('should reject if reminder not found', async () => {
      (prisma.reminders.findFirst as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/v1/reminders/nonexistent', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          isCompleted: true,
        }),
      });

      const response = await PATCH(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/reminders/[id]', () => {
    it('should soft delete a reminder', async () => {
      (prisma.reminders.findFirst as jest.Mock).mockResolvedValue(mockReminder);
      (prisma.reminders.update as jest.Mock).mockResolvedValue({
        ...mockReminder,
        deletedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/v1/reminders/reminder-1', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer test-token',
        },
      });

      const response = await DELETE(request, { params: { id: 'reminder-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.reminders.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'reminder-1' },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should reject if reminder not found', async () => {
      (prisma.reminders.findFirst as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/v1/reminders/nonexistent', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer test-token',
        },
      });

      const response = await DELETE(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });
});

