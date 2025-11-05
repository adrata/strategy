import { NextRequest } from 'next/server';
import { GET, POST, PATCH, DELETE } from '../../route';

// Mock Prisma
jest.mock('@/platform/database/prisma-client', () => ({
  prisma: {
    stacksStory: {
      findFirst: jest.fn()
    },
    stacksComment: {
      findMany: jest.fn(),
      create: jest.fn(),
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

describe('Stacks Comments API Route', () => {
  const mockContext = {
    userId: 'user-1',
    workspaceId: 'workspace-1'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/stacks/stories/[id]/comments', () => {
    it('should fetch comments with nested replies', async () => {
      const { getSecureApiContext } = require('@/platform/services/secure-api-helper');
      const { prisma } = require('@/platform/database/prisma-client');

      getSecureApiContext.mockResolvedValue({
        context: mockContext,
        response: null
      });

      prisma.stacksStory.findFirst.mockResolvedValue({
        id: 'story-1',
        project: { workspaceId: 'workspace-1' }
      });

      prisma.stacksComment.findMany.mockResolvedValue([
        {
          id: 'comment-1',
          content: 'Main comment',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
          },
          replies: [
            {
              id: 'reply-1',
              content: 'Reply comment',
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: {
                id: 'user-2',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com'
              }
            }
          ]
        }
      ]);

      const request = new NextRequest('http://localhost/api/v1/stacks/stories/story-1/comments');
      const response = await GET(request, { params: Promise.resolve({ id: 'story-1' }) });
      const data = await response.json();

      expect(data.comments).toHaveLength(1);
      expect(data.comments[0].content).toBe('Main comment');
      expect(data.comments[0].replies).toHaveLength(1);
      expect(data.comments[0].replies[0].content).toBe('Reply comment');
    });
  });

  describe('POST /api/v1/stacks/stories/[id]/comments', () => {
    it('should create a new comment', async () => {
      const { getSecureApiContext } = require('@/platform/services/secure-api-helper');
      const { prisma } = require('@/platform/database/prisma-client');

      getSecureApiContext.mockResolvedValue({
        context: mockContext,
        response: null
      });

      prisma.stacksStory.findFirst.mockResolvedValue({
        id: 'story-1',
        project: { workspaceId: 'workspace-1' }
      });

      prisma.stacksComment.create.mockResolvedValue({
        id: 'comment-1',
        content: 'New comment',
        storyId: 'story-1',
        createdById: 'user-1',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const request = new NextRequest('http://localhost/api/v1/stacks/stories/story-1/comments', {
        method: 'POST',
        body: JSON.stringify({
          content: 'New comment'
        })
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'story-1' }) });
      const data = await response.json();

      expect(data.comment).toBeDefined();
      expect(data.comment.content).toBe('New comment');
    });

    it('should create a reply when parentId is provided', async () => {
      const { getSecureApiContext } = require('@/platform/services/secure-api-helper');
      const { prisma } = require('@/platform/database/prisma-client');

      getSecureApiContext.mockResolvedValue({
        context: mockContext,
        response: null
      });

      prisma.stacksStory.findFirst.mockResolvedValue({
        id: 'story-1',
        project: { workspaceId: 'workspace-1' }
      });

      prisma.stacksComment.create.mockResolvedValue({
        id: 'reply-1',
        content: 'Reply content',
        storyId: 'story-1',
        createdById: 'user-1',
        parentId: 'comment-1',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const request = new NextRequest('http://localhost/api/v1/stacks/stories/story-1/comments', {
        method: 'POST',
        body: JSON.stringify({
          content: 'Reply content',
          parentId: 'comment-1'
        })
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'story-1' }) });
      const data = await response.json();

      expect(prisma.stacksComment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            parentId: 'comment-1'
          })
        })
      );
    });
  });

  describe('PATCH /api/v1/stacks/stories/[id]/comments', () => {
    it('should update a comment', async () => {
      const { getSecureApiContext } = require('@/platform/services/secure-api-helper');
      const { prisma } = require('@/platform/database/prisma-client');

      getSecureApiContext.mockResolvedValue({
        context: mockContext,
        response: null
      });

      prisma.stacksStory.findFirst.mockResolvedValue({
        id: 'story-1',
        project: { workspaceId: 'workspace-1' }
      });

      prisma.stacksComment.findFirst.mockResolvedValue({
        id: 'comment-1',
        storyId: 'story-1',
        createdById: 'user-1',
        deletedAt: null
      });

      prisma.stacksComment.update.mockResolvedValue({
        id: 'comment-1',
        content: 'Updated content',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const request = new NextRequest('http://localhost/api/v1/stacks/stories/story-1/comments?commentId=comment-1', {
        method: 'PATCH',
        body: JSON.stringify({
          content: 'Updated content'
        })
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'story-1' }) });
      const data = await response.json();

      expect(data.comment.content).toBe('Updated content');
    });
  });

  describe('DELETE /api/v1/stacks/stories/[id]/comments', () => {
    it('should soft delete a comment', async () => {
      const { getSecureApiContext } = require('@/platform/services/secure-api-helper');
      const { prisma } = require('@/platform/database/prisma-client');

      getSecureApiContext.mockResolvedValue({
        context: mockContext,
        response: null
      });

      prisma.stacksStory.findFirst.mockResolvedValue({
        id: 'story-1',
        project: { workspaceId: 'workspace-1' }
      });

      prisma.stacksComment.findFirst.mockResolvedValue({
        id: 'comment-1',
        storyId: 'story-1',
        createdById: 'user-1',
        deletedAt: null
      });

      prisma.stacksComment.update.mockResolvedValue({
        id: 'comment-1',
        deletedAt: new Date()
      });

      const request = new NextRequest('http://localhost/api/v1/stacks/stories/story-1/comments?commentId=comment-1', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: 'story-1' }) });
      const data = await response.json();

      expect(prisma.stacksComment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deletedAt: expect.any(Date)
          })
        })
      );

      expect(data.message).toBe('Comment deleted successfully');
    });
  });
});

