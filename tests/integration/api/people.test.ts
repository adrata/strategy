/**
 * People API Integration Tests
 * 
 * Comprehensive tests for all CRUD operations on people (leads/prospects/opportunities)
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
    people: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    actions: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  })),
}));

// Import after mocks
import { GET, POST } from '@/app/api/v1/people/route';
import { GET as GET_BY_ID, PUT, PATCH, DELETE } from '@/app/api/v1/people/[id]/route';
import { createTestPerson, TEST_USER, getTestAuthHeaders, validateApiResponse, validateTestData, TEST_PIPELINE_DATA } from '../../utils/test-factories';

describe('People API', () => {
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Get the mocked Prisma instance
    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();
  });

  describe('GET /api/v1/people', () => {
    it('should list people with pagination', async () => {
      const mockPeople = [
        createTestPerson('LEAD', { id: 'person-1', fullName: 'John Doe' }),
        createTestPerson('PROSPECT', { id: 'person-2', fullName: 'Jane Smith' }),
      ];

      mockPrisma.people.findMany.mockResolvedValue(mockPeople);
      mockPrisma.people.count.mockResolvedValue(2);

      const request = new Request('http://localhost:3000/api/v1/people?page=1&limit=10', {
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

    it('should filter people by section (leads)', async () => {
      const mockPeople = [
        createTestPerson('LEAD', { id: 'person-1', status: 'LEAD' }),
      ];

      mockPrisma.people.findMany.mockResolvedValue(mockPeople);
      mockPrisma.people.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/people?section=leads', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.people.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'LEAD',
            deletedAt: null,
          }),
        })
      );
    });

    it('should filter people by section (prospects)', async () => {
      const mockPeople = [
        createTestPerson('PROSPECT', { id: 'person-1', status: 'PROSPECT' }),
      ];

      mockPrisma.people.findMany.mockResolvedValue(mockPeople);
      mockPrisma.people.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/people?section=prospects', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.people.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PROSPECT',
            deletedAt: null,
          }),
        })
      );
    });

    it('should filter people by section (opportunities)', async () => {
      const mockPeople = [
        createTestPerson('OPPORTUNITY', { id: 'person-1', status: 'OPPORTUNITY' }),
      ];

      mockPrisma.people.findMany.mockResolvedValue(mockPeople);
      mockPrisma.people.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/people?section=opportunities', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.people.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'OPPORTUNITY',
            deletedAt: null,
          }),
        })
      );
    });

    it('should search people by name and email', async () => {
      const mockPeople = [
        createTestPerson('LEAD', { id: 'person-1', fullName: 'John Doe', email: 'john@example.com' }),
      ];

      mockPrisma.people.findMany.mockResolvedValue(mockPeople);
      mockPrisma.people.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/people?search=John', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.people.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ firstName: expect.objectContaining({ contains: 'John' }) }),
              expect.objectContaining({ lastName: expect.objectContaining({ contains: 'John' }) }),
              expect.objectContaining({ fullName: expect.objectContaining({ contains: 'John' }) }),
              expect.objectContaining({ email: expect.objectContaining({ contains: 'John' }) }),
            ]),
          }),
        })
      );
    });

    it('should return status counts when counts=true', async () => {
      const mockCounts = [
        { status: 'LEAD', _count: { id: 10 } },
        { status: 'PROSPECT', _count: { id: 5 } },
        { status: 'OPPORTUNITY', _count: { id: 3 } },
      ];

      mockPrisma.people.groupBy.mockResolvedValue(mockCounts);

      const request = new Request('http://localhost:3000/api/v1/people?counts=true', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        LEAD: 10,
        PROSPECT: 5,
        OPPORTUNITY: 3,
      });
    });

    it('should require authentication', async () => {
      // Mock auth to return null
      const { getV1AuthUser } = require('@/app/api/v1/auth');
      getV1AuthUser.mockResolvedValueOnce(null);

      const request = new Request('http://localhost:3000/api/v1/people', {
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      validateApiResponse.error(data, 401);
    });
  });

  describe('POST /api/v1/people', () => {
    it('should create a new lead', async () => {
      const personData = createTestPerson('LEAD');
      const createdPerson = { ...personData, id: 'new-person-id' };
      const createdAction = { id: 'action-id', type: 'person_created' };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          people: {
            create: jest.fn().mockResolvedValue(createdPerson),
          },
          actions: {
            create: jest.fn().mockResolvedValue(createdAction),
          },
        });
      });

      const request = new Request('http://localhost:3000/api/v1/people', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(personData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(data);
      expect(data.data.status).toBe('LEAD');
      expect(data.meta.message).toBe('Person created successfully');
    });

    it('should create a new prospect', async () => {
      const personData = createTestPerson('PROSPECT');
      const createdPerson = { ...personData, id: 'new-person-id' };
      const createdAction = { id: 'action-id', type: 'person_created' };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          people: {
            create: jest.fn().mockResolvedValue(createdPerson),
          },
          actions: {
            create: jest.fn().mockResolvedValue(createdAction),
          },
        });
      });

      const request = new Request('http://localhost:3000/api/v1/people', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(personData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.status).toBe('PROSPECT');
    });

    it('should create a new opportunity', async () => {
      const personData = createTestPerson('OPPORTUNITY');
      const createdPerson = { ...personData, id: 'new-person-id' };
      const createdAction = { id: 'action-id', type: 'person_created' };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          people: {
            create: jest.fn().mockResolvedValue(createdPerson),
          },
          actions: {
            create: jest.fn().mockResolvedValue(createdAction),
          },
        });
      });

      const request = new Request('http://localhost:3000/api/v1/people', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(personData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.status).toBe('OPPORTUNITY');
    });

    it('should link person to company via companyId', async () => {
      const personData = createTestPerson('LEAD', { companyId: 'company-123' });
      const createdPerson = { ...personData, id: 'new-person-id' };
      const createdAction = { id: 'action-id', type: 'person_created' };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          people: {
            create: jest.fn().mockResolvedValue(createdPerson),
          },
          actions: {
            create: jest.fn().mockResolvedValue(createdAction),
          },
        });
      });

      const request = new Request('http://localhost:3000/api/v1/people', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(personData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.companyId).toBe('company-123');
    });

    it('should require firstName and lastName', async () => {
      const personData = createTestPerson('LEAD');
      delete personData.firstName;
      delete personData.lastName;

      const request = new Request('http://localhost:3000/api/v1/people', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(personData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      validateApiResponse.error(data, 400);
      expect(data.error).toContain('First name and last name are required');
    });

    it('should handle duplicate person creation', async () => {
      const personData = createTestPerson('LEAD');

      mockPrisma.$transaction.mockRejectedValue({
        code: 'P2002',
        message: 'Unique constraint failed',
      });

      const request = new Request('http://localhost:3000/api/v1/people', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(personData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      validateApiResponse.error(data, 400);
      expect(data.error).toContain('already exists');
    });
  });

  describe('GET /api/v1/people/[id]', () => {
    it('should get a specific person', async () => {
      const person = createTestPerson('LEAD', { id: 'person-1' });
      const mockPerson = {
        ...person,
        company: null,
        mainSeller: { id: TEST_USER.id, firstName: 'Ross', lastName: 'User', name: 'Ross User', email: TEST_USER.email },
        actions: [],
        _count: { actions: 0 },
      };

      mockPrisma.people.findUnique.mockResolvedValue(mockPerson);

      const request = new Request('http://localhost:3000/api/v1/people/person-1', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET_BY_ID(request, { params: { id: 'person-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(data);
      expect(data.data.id).toBe('person-1');
      expect(data.data.mainSeller).toBe('Me'); // Should show 'Me' for current user
      expect(data.data.mainSellerData).toBeDefined();
    });

    it('should return 404 for non-existent person', async () => {
      mockPrisma.people.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/v1/people/non-existent', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET_BY_ID(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      validateApiResponse.error(data, 404);
      expect(data.error).toBe('Person not found');
    });

    it('should not return soft-deleted people', async () => {
      mockPrisma.people.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/v1/people/deleted-person', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET_BY_ID(request, { params: { id: 'deleted-person' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(mockPrisma.people.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'deleted-person',
            deletedAt: null,
          }),
        })
      );
    });
  });

  describe('PATCH /api/v1/people/[id]', () => {
    it('should partially update a person', async () => {
      const existingPerson = createTestPerson('LEAD', { id: 'person-1' });
      const updateData = { status: 'PROSPECT', notes: { content: 'Updated notes' } };
      const updatedPerson = { ...existingPerson, ...updateData };

      mockPrisma.people.findUnique.mockResolvedValue(existingPerson);
      mockPrisma.people.update.mockResolvedValue(updatedPerson);

      const request = new Request('http://localhost:3000/api/v1/people/person-1', {
        method: 'PATCH',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, { params: { id: 'person-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(data);
      expect(data.data.status).toBe('PROSPECT');
      expect(data.data.notes).toEqual({ content: 'Updated notes' });
      expect(data.meta.message).toBe('Person updated successfully');
    });

    it('should update status from LEAD to PROSPECT to OPPORTUNITY', async () => {
      const existingPerson = createTestPerson('LEAD', { id: 'person-1' });
      const updateData = { status: 'PROSPECT' };
      const updatedPerson = { ...existingPerson, ...updateData };

      mockPrisma.people.findUnique.mockResolvedValue(existingPerson);
      mockPrisma.people.update.mockResolvedValue(updatedPerson);

      const request = new Request('http://localhost:3000/api/v1/people/person-1', {
        method: 'PATCH',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, { params: { id: 'person-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.status).toBe('PROSPECT');
    });

    it('should auto-update fullName when firstName or lastName changes', async () => {
      const existingPerson = createTestPerson('LEAD', { 
        id: 'person-1', 
        firstName: 'John', 
        lastName: 'Doe',
        fullName: 'John Doe'
      });
      const updateData = { firstName: 'Jane' };
      const updatedPerson = { 
        ...existingPerson, 
        ...updateData, 
        fullName: 'Jane Doe' // Should be auto-updated
      };

      mockPrisma.people.findUnique.mockResolvedValue(existingPerson);
      mockPrisma.people.update.mockResolvedValue(updatedPerson);

      const request = new Request('http://localhost:3000/api/v1/people/person-1', {
        method: 'PATCH',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, { params: { id: 'person-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.firstName).toBe('Jane');
      expect(data.data.fullName).toBe('Jane Doe');
    });

    it('should return 404 for non-existent person', async () => {
      mockPrisma.people.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/v1/people/non-existent', {
        method: 'PATCH',
        headers: getTestAuthHeaders(),
        body: JSON.stringify({ status: 'PROSPECT' }),
      });

      const response = await PATCH(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      validateApiResponse.error(data, 404);
    });
  });

  describe('DELETE /api/v1/people/[id]', () => {
    it('should soft delete a person by default', async () => {
      const existingPerson = createTestPerson('LEAD', { id: 'person-1' });
      existingPerson._count = { actions: 0 };

      mockPrisma.people.findUnique.mockResolvedValue(existingPerson);
      mockPrisma.people.update.mockResolvedValue({ ...existingPerson, deletedAt: new Date() });

      const request = new Request('http://localhost:3000/api/v1/people/person-1', {
        method: 'DELETE',
        headers: getTestAuthHeaders(),
      });

      const response = await DELETE(request, { params: { id: 'person-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(data);
      expect(data.meta.message).toBe('Person deleted successfully');
      expect(data.meta.mode).toBe('soft');
      expect(mockPrisma.people.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'person-1' },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
            updatedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should hard delete a person when mode=hard', async () => {
      const existingPerson = createTestPerson('LEAD', { id: 'person-1' });
      existingPerson._count = { actions: 0 };

      mockPrisma.people.findUnique.mockResolvedValue(existingPerson);
      mockPrisma.people.delete.mockResolvedValue(existingPerson);

      const request = new Request('http://localhost:3000/api/v1/people/person-1?mode=hard', {
        method: 'DELETE',
        headers: getTestAuthHeaders(),
      });

      const response = await DELETE(request, { params: { id: 'person-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.meta.message).toBe('Person permanently deleted successfully');
      expect(data.meta.mode).toBe('hard');
      expect(mockPrisma.people.delete).toHaveBeenCalledWith({
        where: { id: 'person-1' },
      });
    });

    it('should prevent hard delete when person has related actions', async () => {
      const existingPerson = createTestPerson('LEAD', { id: 'person-1' });
      existingPerson._count = { actions: 3 };

      mockPrisma.people.findUnique.mockResolvedValue(existingPerson);

      const request = new Request('http://localhost:3000/api/v1/people/person-1?mode=hard', {
        method: 'DELETE',
        headers: getTestAuthHeaders(),
      });

      const response = await DELETE(request, { params: { id: 'person-1' } });
      const data = await response.json();

      expect(response.status).toBe(409);
      validateApiResponse.error(data, 409);
      expect(data.error).toContain('Cannot hard delete person with associated actions');
    });

    it('should return 404 for non-existent person', async () => {
      mockPrisma.people.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/v1/people/non-existent', {
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
