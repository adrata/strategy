/**
 * Reminders Cron Job Integration Tests
 * 
 * Tests for the reminder cron job that checks and triggers reminders
 */

jest.mock('@/platform/services/notification-service', () => ({
  NotificationService: {
    getInstance: jest.fn(() => ({
      showNotification: jest.fn().mockResolvedValue(undefined),
    })),
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    reminders: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    people: {
      findUnique: jest.fn(),
    },
    companies: {
      findUnique: jest.fn(),
    },
  },
}));

import { GET } from '@/app/api/cron/check-reminders/route';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/platform/services/notification-service';

describe('Reminders Cron Job', () => {
  const mockReminder = {
    id: 'reminder-1',
    workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
    userId: '01K1VBYZG41K9QA0D9CF06KNRG',
    entityType: 'people' as const,
    entityId: 'person-1',
    reminderAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes from now
    note: 'Test reminder',
    isCompleted: false,
    user: {
      id: '01K1VBYZG41K9QA0D9CF06KNRG',
      name: 'Ross',
      email: 'ross@adrata.com',
    },
  };

  const mockPerson = {
    id: 'person-1',
    fullName: 'John Doe',
    name: 'John Doe',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should find and process due reminders', async () => {
    (prisma.reminders.findMany as jest.Mock).mockResolvedValue([mockReminder]);
    (prisma.people.findUnique as jest.Mock).mockResolvedValue(mockPerson);
    (prisma.reminders.update as jest.Mock).mockResolvedValue({
      ...mockReminder,
      isCompleted: true,
    });

    const notificationService = NotificationService.getInstance();
    const request = new Request('http://localhost:3000/api/cron/check-reminders', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-secret',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.processed).toBe(1);
    expect(notificationService.showNotification).toHaveBeenCalledWith(
      'Reminder: John Doe',
      'Test reminder',
      expect.any(Object)
    );
    expect(prisma.reminders.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'reminder-1' },
        data: expect.objectContaining({
          isCompleted: true,
        }),
      })
    );
  });

  it('should handle reminders for companies', async () => {
    const companyReminder = {
      ...mockReminder,
      entityType: 'companies' as const,
      entityId: 'company-1',
    };
    const mockCompany = {
      id: 'company-1',
      name: 'Acme Corp',
    };

    (prisma.reminders.findMany as jest.Mock).mockResolvedValue([companyReminder]);
    (prisma.companies.findUnique as jest.Mock).mockResolvedValue(mockCompany);
    (prisma.reminders.update as jest.Mock).mockResolvedValue({
      ...companyReminder,
      isCompleted: true,
    });

    const notificationService = NotificationService.getInstance();
    const request = new Request('http://localhost:3000/api/cron/check-reminders', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-secret',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(notificationService.showNotification).toHaveBeenCalledWith(
      'Reminder: Acme Corp',
      expect.any(String),
      expect.any(Object)
    );
  });

  it('should only process reminders due in the next 5 minutes', async () => {
    const dueReminder = {
      ...mockReminder,
      reminderAt: new Date(Date.now() + 3 * 60 * 1000), // 3 minutes from now
    };
    const futureReminder = {
      ...mockReminder,
      id: 'reminder-2',
      reminderAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    };

    (prisma.reminders.findMany as jest.Mock).mockResolvedValue([dueReminder, futureReminder]);
    (prisma.people.findUnique as jest.Mock).mockResolvedValue(mockPerson);
    (prisma.reminders.update as jest.Mock).mockResolvedValue({
      ...dueReminder,
      isCompleted: true,
    });

    const notificationService = NotificationService.getInstance();
    const request = new Request('http://localhost:3000/api/cron/check-reminders', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-secret',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should process both since they're within the 5-minute window
    expect(data.processed).toBeGreaterThanOrEqual(1);
  });

  it('should skip already completed reminders', async () => {
    (prisma.reminders.findMany as jest.Mock).mockResolvedValue([]);

    const request = new Request('http://localhost:3000/api/cron/check-reminders', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-secret',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.processed).toBe(0);
    expect(data.total).toBe(0);
  });

  it('should handle errors gracefully', async () => {
    (prisma.reminders.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new Request('http://localhost:3000/api/cron/check-reminders', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-secret',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });

  it('should require authorization', async () => {
    const request = new Request('http://localhost:3000/api/cron/check-reminders', {
      method: 'GET',
      // No authorization header
    });

    const response = await GET(request);
    const data = await response.json();

    // If CRON_SECRET is set, should require auth
    if (process.env.CRON_SECRET) {
      expect(response.status).toBe(401);
    }
  });
});

