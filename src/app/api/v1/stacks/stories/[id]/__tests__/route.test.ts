import { NextRequest } from 'next/server';
import { GET, PATCH } from '../../route';

// Mock Prisma
jest.mock('@/platform/database/prisma-client', () => ({
  prisma: {
    stacksStory: {
      findFirst: jest.fn(),
      update: jest.fn()
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

// Mock URL utils
jest.mock('@/platform/utils/url-utils', () => ({
  extractIdFromSlug: jest.fn((slug) => slug)
}));

describe('Stacks Story API Route (Single Story)', () => {
  const mockContext = {
    userId: 'user-1',
    workspaceId: 'workspace-1'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/stacks/stories/[id]', () => {
    it('should include acceptanceCriteria in GET response', async () => {
      const { getSecureApiContext } = require('@/platform/services/secure-api-helper');
      const { prisma } = require('@/platform/database/prisma-client');

      getSecureApiContext.mockResolvedValue({
        context: mockContext,
        response: null
      });

      prisma.stacksStory.findFirst.mockResolvedValue({
        id: 'story-1',
        title: 'Test Story',
        description: 'Test description',
        acceptanceCriteria: 'Test acceptance criteria',
        status: 'todo',
        priority: 'high',
        isFlagged: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: null,
        epoch: null,
        project: { id: 'project-1', name: 'Test Project' }
      });

      const request = new NextRequest('http://localhost/api/v1/stacks/stories/story-1');
      const response = await GET(request, { params: Promise.resolve({ id: 'story-1' }) });
      const data = await response.json();

      expect(data.story).toHaveProperty('acceptanceCriteria');
      expect(data.story.acceptanceCriteria).toBe('Test acceptance criteria');
    });

    it('should include acceptanceCriteria in select statement', async () => {
      const { getSecureApiContext } = require('@/platform/services/secure-api-helper');
      const { prisma } = require('@/platform/database/prisma-client');

      getSecureApiContext.mockResolvedValue({
        context: mockContext,
        response: null
      });

      prisma.stacksStory.findFirst.mockResolvedValue({
        id: 'story-1',
        title: 'Test Story',
        description: 'Test description',
        acceptanceCriteria: 'Test acceptance criteria',
        status: 'todo',
        priority: 'high',
        isFlagged: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: null,
        epoch: null,
        project: { id: 'project-1', name: 'Test Project' }
      });

      await GET(new NextRequest('http://localhost/api/v1/stacks/stories/story-1'), {
        params: Promise.resolve({ id: 'story-1' })
      });

      expect(prisma.stacksStory.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            acceptanceCriteria: true
          })
        })
      );
    });
  });

  describe('PATCH /api/v1/stacks/stories/[id]', () => {
    it('should update acceptanceCriteria', async () => {
      const { getSecureApiContext } = require('@/platform/services/secure-api-helper');
      const { prisma } = require('@/platform/database/prisma-client');

      getSecureApiContext.mockResolvedValue({
        context: mockContext,
        response: null
      });

      prisma.stacksStory.findFirst.mockResolvedValue({
        id: 'story-1',
        title: 'Test Story',
        status: 'todo',
        project: { workspaceId: 'workspace-1' }
      });

      prisma.stacksStory.update.mockResolvedValue({
        id: 'story-1',
        title: 'Test Story',
        description: 'Updated description',
        acceptanceCriteria: 'Updated acceptance criteria',
        status: 'todo',
        priority: 'high',
        isFlagged: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: null,
        epoch: null,
        project: { id: 'project-1', name: 'Test Project' }
      });

      const request = new NextRequest('http://localhost/api/v1/stacks/stories/story-1', {
        method: 'PATCH',
        body: JSON.stringify({
          acceptanceCriteria: 'Updated acceptance criteria'
        })
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'story-1' }) });
      const data = await response.json();

      expect(prisma.stacksStory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            acceptanceCriteria: 'Updated acceptance criteria'
          })
        })
      );

      expect(data.story.acceptanceCriteria).toBe('Updated acceptance criteria');
    });
  });
});

