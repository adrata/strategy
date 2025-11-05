import { NextRequest } from 'next/server';
import { GET, POST } from '../../route';

// Mock Prisma
jest.mock('@/platform/database/prisma-client', () => ({
  prisma: {
    stacksStory: {
      findMany: jest.fn(),
      create: jest.fn()
    },
    stacksProject: {
      findFirst: jest.fn(),
      create: jest.fn()
    }
  }
}));

// Mock secure API helper
jest.mock('@/platform/services/secure-api-helper', () => ({
  getSecureApiContext: jest.fn(),
  createErrorResponse: jest.fn((message, code, status) => ({
    status,
    json: async () => ({ error: message, code })
  }))
}));

describe('Stacks Stories API Route', () => {
  const mockContext = {
    userId: 'user-1',
    workspaceId: 'workspace-1'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/stacks/stories', () => {
    it('should include acceptanceCriteria in response', async () => {
      const { getSecureApiContext } = require('@/platform/services/secure-api-helper');
      const { prisma } = require('@/platform/database/prisma-client');

      getSecureApiContext.mockResolvedValue({
        context: mockContext,
        response: null
      });

      prisma.stacksStory.findMany.mockResolvedValue([
        {
          id: 'story-1',
          title: 'Test Story',
          description: 'Test description',
          acceptanceCriteria: 'Test acceptance criteria',
          status: 'todo',
          priority: 'high',
          isFlagged: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      const request = new NextRequest('http://localhost/api/v1/stacks/stories?workspaceId=workspace-1');
      const response = await GET(request);
      const data = await response.json();

      expect(data.stories).toHaveLength(1);
      expect(data.stories[0]).toHaveProperty('acceptanceCriteria');
      expect(data.stories[0].acceptanceCriteria).toBe('Test acceptance criteria');
    });

    it('should handle null acceptanceCriteria', async () => {
      const { getSecureApiContext } = require('@/platform/services/secure-api-helper');
      const { prisma } = require('@/platform/database/prisma-client');

      getSecureApiContext.mockResolvedValue({
        context: mockContext,
        response: null
      });

      prisma.stacksStory.findMany.mockResolvedValue([
        {
          id: 'story-1',
          title: 'Test Story',
          description: 'Test description',
          acceptanceCriteria: null,
          status: 'todo',
          priority: 'high',
          isFlagged: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      const request = new NextRequest('http://localhost/api/v1/stacks/stories?workspaceId=workspace-1');
      const response = await GET(request);
      const data = await response.json();

      expect(data.stories[0].acceptanceCriteria).toBeNull();
    });
  });

  describe('POST /api/v1/stacks/stories', () => {
    it('should create story with acceptanceCriteria', async () => {
      const { getSecureApiContext } = require('@/platform/services/secure-api-helper');
      const { prisma } = require('@/platform/database/prisma-client');

      getSecureApiContext.mockResolvedValue({
        context: mockContext,
        response: null
      });

      prisma.stacksProject.findFirst.mockResolvedValue({
        id: 'project-1',
        workspaceId: 'workspace-1'
      });

      prisma.stacksStory.create.mockResolvedValue({
        id: 'story-1',
        title: 'New Story',
        description: 'Description',
        acceptanceCriteria: 'Acceptance criteria',
        status: 'todo',
        priority: 'medium',
        isFlagged: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const request = new NextRequest('http://localhost/api/v1/stacks/stories', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Story',
          description: 'Description',
          acceptanceCriteria: 'Acceptance criteria',
          status: 'todo',
          priority: 'medium'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(prisma.stacksStory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            acceptanceCriteria: 'Acceptance criteria'
          })
        })
      );
    });
  });
});

