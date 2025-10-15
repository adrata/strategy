/**
 * State Ranking API Integration Tests
 * 
 * Tests for the state ranking API endpoints
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock the secure API helper
const mockGetSecureApiContext = jest.fn();
const mockCreateSuccessResponse = jest.fn();
const mockCreateErrorResponse = jest.fn();
const mockLogAndCreateErrorResponse = jest.fn();

jest.mock('@/platform/services/secure-api-helper', () => ({
  getSecureApiContext: mockGetSecureApiContext,
  createSuccessResponse: mockCreateSuccessResponse,
  createErrorResponse: mockCreateErrorResponse,
  logAndCreateErrorResponse: mockLogAndCreateErrorResponse,
}));

// Mock Prisma
const mockPrisma = {
  companies: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  users: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Import the API handlers
import { GET as getStateData } from '@/app/api/v1/speedrun/state-data/route';
import { GET as getUserSettings, POST as updateUserSettings } from '@/app/api/v1/user/settings/route';

describe('State Ranking API Integration Tests', () => {
  const mockWorkspaceId = 'test-workspace-123';
  const mockUserId = 'test-user-456';
  const mockContext = {
    userId: mockUserId,
    workspaceId: mockWorkspaceId,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockGetSecureApiContext.mockResolvedValue({
      context: mockContext,
      response: null
    });
    
    mockCreateSuccessResponse.mockImplementation((data, meta) => ({
      success: true,
      data,
      meta
    }));
    
    mockCreateErrorResponse.mockImplementation((message, code, status) => ({
      success: false,
      error: message,
      code,
      status
    }));
  });

  describe('GET /api/v1/speedrun/state-data', () => {
    it('should return state ranking data successfully', async () => {
      const mockCompanies = [
        {
          id: 'company-1',
          name: 'Acme Corp',
          hqState: 'CA',
          _count: { people: 5 }
        },
        {
          id: 'company-2',
          name: 'Beta Inc',
          hqState: 'NY',
          _count: { people: 3 }
        }
      ];

      mockPrisma.companies.findMany.mockResolvedValue(mockCompanies);
      mockPrisma.companies.count.mockResolvedValue(2);

      const request = new NextRequest('http://localhost:3000/api/v1/speedrun/state-data');
      const response = await getStateData(request);

      expect(mockGetSecureApiContext).toHaveBeenCalledWith(request, {
        requireAuth: true,
        requireWorkspaceAccess: true
      });

      expect(mockPrisma.companies.findMany).toHaveBeenCalledWith({
        where: {
          workspaceId: mockWorkspaceId,
          deletedAt: null,
          hqState: { not: null }
        },
        select: {
          id: true,
          name: true,
          hqState: true,
          _count: {
            select: {
              people: {
                where: {
                  deletedAt: null
                }
              }
            }
          }
        }
      });

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          stateRankings: expect.arrayContaining([
            expect.objectContaining({
              state: 'CA',
              companyCount: 1,
              peopleCount: 5
            }),
            expect.objectContaining({
              state: 'NY',
              companyCount: 1,
              peopleCount: 3
            })
          ]),
          validation: expect.objectContaining({
            isValid: true,
            hasStateData: true,
            stateDataPercentage: 100
          })
        }),
        expect.objectContaining({
          message: 'State ranking data retrieved successfully',
          userId: mockUserId,
          workspaceId: mockWorkspaceId
        })
      );
    });

    it('should handle authentication failure', async () => {
      mockGetSecureApiContext.mockResolvedValue({
        context: null,
        response: { success: false, error: 'Unauthorized' }
      });

      const request = new NextRequest('http://localhost:3000/api/v1/speedrun/state-data');
      const response = await getStateData(request);

      expect(mockGetSecureApiContext).toHaveBeenCalled();
      expect(mockPrisma.companies.findMany).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.companies.findMany.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/v1/speedrun/state-data');
      const response = await getStateData(request);

      expect(mockLogAndCreateErrorResponse).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          endpoint: 'V1 SPEEDRUN STATE DATA API',
          userId: mockUserId,
          workspaceId: mockWorkspaceId
        }),
        'Failed to fetch state ranking data',
        'STATE_DATA_FETCH_ERROR',
        500
      );
    });

    it('should return empty data for workspace with no companies', async () => {
      mockPrisma.companies.findMany.mockResolvedValue([]);
      mockPrisma.companies.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/v1/speedrun/state-data');
      const response = await getStateData(request);

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          stateRankings: [],
          validation: expect.objectContaining({
            isValid: false,
            hasStateData: false,
            stateDataPercentage: 0
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe('GET /api/v1/user/settings', () => {
    it('should return user settings successfully', async () => {
      const mockUser = {
        id: mockUserId,
        timezone: 'America/New_York',
        name: 'Test User',
        email: 'test@example.com'
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/v1/user/settings');
      const response = await getUserSettings(request);

      expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: {
          id: true,
          timezone: true,
          name: true,
          email: true
        }
      });

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          workspaceId: mockWorkspaceId,
          speedrunRankingMode: 'global',
          stateRankingOrder: [],
          timezone: 'America/New_York',
          name: 'Test User',
          email: 'test@example.com'
        }),
        expect.objectContaining({
          message: 'User settings retrieved successfully'
        })
      );
    });

    it('should handle user not found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/v1/user/settings');
      const response = await getUserSettings(request);

      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'User not found',
        'USER_NOT_FOUND',
        404
      );
    });
  });

  describe('POST /api/v1/user/settings', () => {
    it('should update user settings successfully', async () => {
      const mockUpdatedUser = {
        id: mockUserId,
        timezone: 'America/Los_Angeles',
        name: 'Test User',
        email: 'test@example.com'
      };

      mockPrisma.users.update.mockResolvedValue(mockUpdatedUser);

      const requestBody = {
        speedrunRankingMode: 'state-based',
        stateRankingOrder: ['CA', 'NY', 'TX'],
        timezone: 'America/Los_Angeles'
      };

      const request = new NextRequest('http://localhost:3000/api/v1/user/settings', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await updateUserSettings(request);

      expect(mockPrisma.users.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          timezone: 'America/Los_Angeles',
          updatedAt: expect.any(Date)
        },
        select: {
          id: true,
          timezone: true,
          name: true,
          email: true
        }
      });

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          workspaceId: mockWorkspaceId,
          speedrunRankingMode: 'global', // Default value until schema migration
          stateRankingOrder: [], // Default value until schema migration
          timezone: 'America/Los_Angeles',
          name: 'Test User',
          email: 'test@example.com'
        }),
        expect.objectContaining({
          message: 'User settings updated successfully'
        })
      );
    });

    it('should validate ranking mode input', async () => {
      const requestBody = {
        speedrunRankingMode: 'invalid-mode',
        stateRankingOrder: ['CA', 'NY']
      };

      const request = new NextRequest('http://localhost:3000/api/v1/user/settings', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await updateUserSettings(request);

      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'Invalid ranking mode',
        'INVALID_RANKING_MODE',
        400
      );
    });

    it('should validate state ranking order input', async () => {
      const requestBody = {
        speedrunRankingMode: 'state-based',
        stateRankingOrder: 'not-an-array'
      };

      const request = new NextRequest('http://localhost:3000/api/v1/user/settings', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await updateUserSettings(request);

      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'State ranking order must be an array',
        'INVALID_STATE_ORDER',
        400
      );
    });

    it('should handle database update errors', async () => {
      mockPrisma.users.update.mockRejectedValue(new Error('Database update failed'));

      const requestBody = {
        timezone: 'America/Los_Angeles'
      };

      const request = new NextRequest('http://localhost:3000/api/v1/user/settings', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await updateUserSettings(request);

      expect(mockLogAndCreateErrorResponse).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          endpoint: 'V1 USER SETTINGS API',
          userId: mockUserId,
          workspaceId: mockWorkspaceId
        }),
        'Failed to update user settings',
        'USER_SETTINGS_UPDATE_ERROR',
        500
      );
    });
  });

  describe('API Error Handling', () => {
    it('should handle missing authentication context', async () => {
      mockGetSecureApiContext.mockResolvedValue({
        context: null,
        response: null
      });

      const request = new NextRequest('http://localhost:3000/api/v1/speedrun/state-data');
      const response = await getStateData(request);

      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'Authentication required',
        'AUTH_REQUIRED',
        401
      );
    });

    it('should handle malformed request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/user/settings', {
        method: 'POST',
        body: 'invalid-json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await updateUserSettings(request);

      expect(mockLogAndCreateErrorResponse).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          endpoint: 'V1 USER SETTINGS API'
        }),
        'Failed to update user settings',
        'USER_SETTINGS_UPDATE_ERROR',
        500
      );
    });
  });

  describe('Performance Tests', () => {
    it('should handle large state datasets efficiently', async () => {
      // Mock a large dataset
      const largeCompanyList = Array.from({ length: 1000 }, (_, index) => ({
        id: `company-${index}`,
        name: `Company ${index}`,
        hqState: ['CA', 'NY', 'TX', 'FL', 'WA'][index % 5],
        _count: { people: Math.floor(Math.random() * 20) + 1 }
      }));

      mockPrisma.companies.findMany.mockResolvedValue(largeCompanyList);
      mockPrisma.companies.count.mockResolvedValue(1000);

      const startTime = Date.now();
      const request = new NextRequest('http://localhost:3000/api/v1/speedrun/state-data');
      const response = await getStateData(request);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(mockCreateSuccessResponse).toHaveBeenCalled();
    });
  });
});
