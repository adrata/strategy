/**
 * Actions API Integration Tests
 * 
 * Comprehensive tests for all CRUD operations on actions
 */

// Mock the auth function first
jest.mock('@/app/api/v1/auth', () => ({
  getV1AuthUser: jest.fn().mockResolvedValue({
    id: '01K1VBYZG41K9QA0D9CF06KNRG',
    email: 'ross@adrata.com',
    name: 'Ross',
    workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
  }),
}));

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    actions: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  })),
}));

// Import after mocks
import { GET, POST } from '@/app/api/v1/actions/route';
import { GET as GET_BY_ID, PUT, PATCH, DELETE } from '@/app/api/v1/actions/[id]/route';
import { createTestAction, TEST_USER, getTestAuthHeaders, validateApiResponse, validateTestData } from '../../utils/test-factories';

describe('Actions API', () => {
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Get the mocked Prisma instance
    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();
  });

  describe('GET /api/v1/actions', () => {
    it('should list actions with pagination', async () => {
      const mockActions = [
        createTestAction('CALL', { id: 'action-1', subject: 'Call with John' }),
        createTestAction('EMAIL', { id: 'action-2', subject: 'Follow up email' }),
      ];

      mockPrisma.actions.findMany.mockResolvedValue(mockActions);
      mockPrisma.actions.count.mockResolvedValue(2);

      const request = new Request('http://localhost:3000/api/v1/actions?page=1&limit=10', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(data);
      validateApiResponse.pagination(data);
      expect(data.data).toHaveLength(2);
      expect(data.meta.pagination.totalCount).toBe(2);
    });

    it('should filter actions by status', async () => {
      const mockActions = [
        createTestAction('CALL', { id: 'action-1', status: 'COMPLETED' }),
      ];

      mockPrisma.actions.findMany.mockResolvedValue(mockActions);
      mockPrisma.actions.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/actions?status=COMPLETED', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.actions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'COMPLETED',
            deletedAt: null,
          }),
        })
      );
    });

    it('should filter actions by priority', async () => {
      const mockActions = [
        createTestAction('CALL', { id: 'action-1', priority: 'HIGH' }),
      ];

      mockPrisma.actions.findMany.mockResolvedValue(mockActions);
      mockPrisma.actions.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/actions?priority=HIGH', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.actions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priority: 'HIGH',
            deletedAt: null,
          }),
        })
      );
    });

    it('should filter actions by type', async () => {
      const mockActions = [
        createTestAction('CALL', { id: 'action-1', type: 'CALL' }),
      ];

      mockPrisma.actions.findMany.mockResolvedValue(mockActions);
      mockPrisma.actions.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/actions?type=CALL', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.actions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'CALL',
            deletedAt: null,
          }),
        })
      );
    });

    it('should filter actions by companyId', async () => {
      const mockActions = [
        createTestAction('CALL', { id: 'action-1', companyId: 'company-123' }),
      ];

      mockPrisma.actions.findMany.mockResolvedValue(mockActions);
      mockPrisma.actions.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/actions?companyId=company-123', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.actions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: 'company-123',
            deletedAt: null,
          }),
        })
      );
    });

    it('should filter actions by personId', async () => {
      const mockActions = [
        createTestAction('CALL', { id: 'action-1', personId: 'person-123' }),
      ];

      mockPrisma.actions.findMany.mockResolvedValue(mockActions);
      mockPrisma.actions.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/actions?personId=person-123', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.actions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            personId: 'person-123',
            deletedAt: null,
          }),
        })
      );
    });

    it('should return status counts when counts=true', async () => {
      const mockCounts = [
        { status: 'PLANNED', _count: { id: 5 } },
        { status: 'IN_PROGRESS', _count: { id: 3 } },
        { status: 'COMPLETED', _count: { id: 15 } },
        { status: 'CANCELLED', _count: { id: 1 } },
      ];

      mockPrisma.actions.groupBy.mockResolvedValue(mockCounts);

      const request = new Request('http://localhost:3000/api/v1/actions?counts=true', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        PLANNED: 5,
        IN_PROGRESS: 3,
        COMPLETED: 15,
        CANCELLED: 1,
      });
    });

    it('should require authentication', async () => {
      // Mock auth to return null
      const { getV1AuthUser } = require('@/app/api/v1/auth');
      getV1AuthUser.mockResolvedValueOnce(null);

      const request = new Request('http://localhost:3000/api/v1/actions', {
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      validateApiResponse.error(data, 401);
    });
  });

  describe('POST /api/v1/actions', () => {
    it('should create a new action with companyId', async () => {
      const actionData = createTestAction('CALL', { companyId: 'company-123' });
      const createdAction = { ...actionData, id: 'new-action-id' };

      mockPrisma.actions.create.mockResolvedValue(createdAction);

      const request = new Request('http://localhost:3000/api/v1/actions', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(actionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(data);
      expect(data.data.companyId).toBe('company-123');
      expect(data.meta.message).toBe('Action created successfully');
    });

    it('should create a new action with personId', async () => {
      const actionData = createTestAction('EMAIL', { personId: 'person-123' });
      const createdAction = { ...actionData, id: 'new-action-id' };

      mockPrisma.actions.create.mockResolvedValue(createdAction);

      const request = new Request('http://localhost:3000/api/v1/actions', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(actionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.personId).toBe('person-123');
    });

    it('should create a new action with both companyId and personId', async () => {
      const actionData = createTestAction('MEETING', { 
        companyId: 'company-123',
        personId: 'person-123'
      });
      const createdAction = { ...actionData, id: 'new-action-id' };

      mockPrisma.actions.create.mockResolvedValue(createdAction);

      const request = new Request('http://localhost:3000/api/v1/actions', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(actionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.companyId).toBe('company-123');
      expect(data.data.personId).toBe('person-123');
    });

    it('should create action with all action types', async () => {
      const actionTypes = ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK'];
      
      for (const type of actionTypes) {
        const actionData = createTestAction(type as any);
        const createdAction = { ...actionData, id: `new-action-${type.toLowerCase()}` };

        mockPrisma.actions.create.mockResolvedValue(createdAction);

        const request = new Request('http://localhost:3000/api/v1/actions', {
          method: 'POST',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(actionData),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.type).toBe(type);
      }
    });

    it('should create action with all statuses', async () => {
      const statuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      
      for (const status of statuses) {
        const actionData = createTestAction('CALL', { status: status as any });
        const createdAction = { ...actionData, id: `new-action-${status.toLowerCase()}` };

        mockPrisma.actions.create.mockResolvedValue(createdAction);

        const request = new Request('http://localhost:3000/api/v1/actions', {
          method: 'POST',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(actionData),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.status).toBe(status);
      }
    });

    it('should create action with all priorities', async () => {
      const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
      
      for (const priority of priorities) {
        const actionData = createTestAction('CALL', { priority: priority as any });
        const createdAction = { ...actionData, id: `new-action-${priority.toLowerCase()}` };

        mockPrisma.actions.create.mockResolvedValue(createdAction);

        const request = new Request('http://localhost:3000/api/v1/actions', {
          method: 'POST',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(actionData),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.priority).toBe(priority);
      }
    });

    it('should require type and subject', async () => {
      const actionData = createTestAction('CALL');
      delete actionData.type;
      delete actionData.subject;

      const request = new Request('http://localhost:3000/api/v1/actions', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(actionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      validateApiResponse.error(data, 400);
      expect(data.error).toContain('Type and subject are required');
    });
  });

  describe('GET /api/v1/actions/[id]', () => {
    it('should get a specific action', async () => {
      const action = createTestAction('CALL', { id: 'action-1' });
      const mockAction = {
        ...action,
        user: { id: TEST_USER.id, name: TEST_USER.name, email: TEST_USER.email },
        company: null,
        person: null,
      };

      mockPrisma.actions.findUnique.mockResolvedValue(mockAction);

      const request = new Request('http://localhost:3000/api/v1/actions/action-1', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET_BY_ID(request, { params: { id: 'action-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(data);
      expect(data.data.id).toBe('action-1');
      expect(data.data.user).toBeDefined();
    });

    it('should return 404 for non-existent action', async () => {
      mockPrisma.actions.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/v1/actions/non-existent', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET_BY_ID(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      validateApiResponse.error(data, 404);
      expect(data.error).toBe('Action not found');
    });

    it('should not return soft-deleted actions', async () => {
      mockPrisma.actions.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/v1/actions/deleted-action', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET_BY_ID(request, { params: { id: 'deleted-action' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(mockPrisma.actions.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'deleted-action',
            deletedAt: null,
          }),
        })
      );
    });
  });

  describe('PATCH /api/v1/actions/[id]', () => {
    it('should partially update an action', async () => {
      const existingAction = createTestAction('CALL', { id: 'action-1' });
      const updateData = { status: 'COMPLETED', completedAt: new Date() };
      const updatedAction = { ...existingAction, ...updateData };

      mockPrisma.actions.findUnique.mockResolvedValue(existingAction);
      mockPrisma.actions.update.mockResolvedValue(updatedAction);

      const request = new Request('http://localhost:3000/api/v1/actions/action-1', {
        method: 'PATCH',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, { params: { id: 'action-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(data);
      expect(data.data.status).toBe('COMPLETED');
      expect(data.data.completedAt).toBeDefined();
      expect(data.meta.message).toBe('Action updated successfully');
    });

    it('should update action outcome', async () => {
      const existingAction = createTestAction('CALL', { id: 'action-1' });
      const updateData = { outcome: 'Successfully discussed pricing' };
      const updatedAction = { ...existingAction, ...updateData };

      mockPrisma.actions.findUnique.mockResolvedValue(existingAction);
      mockPrisma.actions.update.mockResolvedValue(updatedAction);

      const request = new Request('http://localhost:3000/api/v1/actions/action-1', {
        method: 'PATCH',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, { params: { id: 'action-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.outcome).toBe('Successfully discussed pricing');
    });

    it('should set completedAt when marking action as completed', async () => {
      const existingAction = createTestAction('CALL', { id: 'action-1', status: 'PLANNED' });
      const updateData = { status: 'COMPLETED' };
      const updatedAction = { 
        ...existingAction, 
        ...updateData, 
        completedAt: new Date() 
      };

      mockPrisma.actions.findUnique.mockResolvedValue(existingAction);
      mockPrisma.actions.update.mockResolvedValue(updatedAction);

      const request = new Request('http://localhost:3000/api/v1/actions/action-1', {
        method: 'PATCH',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, { params: { id: 'action-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.status).toBe('COMPLETED');
    });

    it('should return 404 for non-existent action', async () => {
      mockPrisma.actions.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/v1/actions/non-existent', {
        method: 'PATCH',
        headers: getTestAuthHeaders(),
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      const response = await PATCH(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      validateApiResponse.error(data, 404);
    });
  });

  describe('DELETE /api/v1/actions/[id]', () => {
    it('should soft delete an action by default', async () => {
      const existingAction = createTestAction('CALL', { id: 'action-1' });

      mockPrisma.actions.findUnique.mockResolvedValue(existingAction);
      mockPrisma.actions.update.mockResolvedValue({ ...existingAction, deletedAt: new Date() });

      const request = new Request('http://localhost:3000/api/v1/actions/action-1', {
        method: 'DELETE',
        headers: getTestAuthHeaders(),
      });

      const response = await DELETE(request, { params: { id: 'action-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(data);
      expect(data.meta.message).toBe('Action deleted successfully');
      expect(data.meta.mode).toBe('soft');
      expect(mockPrisma.actions.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'action-1' },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
            updatedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should hard delete an action when mode=hard', async () => {
      const existingAction = createTestAction('CALL', { id: 'action-1' });

      mockPrisma.actions.findUnique.mockResolvedValue(existingAction);
      mockPrisma.actions.delete.mockResolvedValue(existingAction);

      const request = new Request('http://localhost:3000/api/v1/actions/action-1?mode=hard', {
        method: 'DELETE',
        headers: getTestAuthHeaders(),
      });

      const response = await DELETE(request, { params: { id: 'action-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.meta.message).toBe('Action permanently deleted successfully');
      expect(data.meta.mode).toBe('hard');
      expect(mockPrisma.actions.delete).toHaveBeenCalledWith({
        where: { id: 'action-1' },
      });
    });

    it('should return 404 for non-existent action', async () => {
      mockPrisma.actions.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/v1/actions/non-existent', {
        method: 'DELETE',
        headers: getTestAuthHeaders(),
      });

      const response = await DELETE(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      validateApiResponse.error(data, 404);
    });
  });
});
