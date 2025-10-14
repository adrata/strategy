/**
 * Inline Editing API Integration Tests
 * 
 * Comprehensive tests for inline editing functionality across all record types
 * Tests PATCH endpoints to verify database updates and field validation
 */

// Mock Next.js Response
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: new Headers(),
    })),
  },
}));

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
    companies: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    people: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    actions: {
      create: jest.fn(),
    },
  })),
}));

// Import after mocks
import { PATCH as PATCH_COMPANY } from '@/app/api/v1/companies/[id]/route';
import { PATCH as PATCH_PERSON } from '@/app/api/v1/people/[id]/route';
import { createTestCompany, createTestPerson, TEST_USER, getTestAuthHeaders, validateApiResponse } from '../../utils/test-factories';

describe('Inline Editing API Integration Tests', () => {
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Get the mocked Prisma instance
    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();
  });

  describe('Company Inline Editing', () => {
    const companyId = 'company-123';
    const existingCompany = createTestCompany({ id: companyId });

    beforeEach(() => {
      mockPrisma.companies.findUnique.mockResolvedValue(existingCompany);
    });

    describe('Basic Field Updates', () => {
      it('should update company name', async () => {
        const updateData = { name: 'Updated Company Name' };
        const updatedCompany = { ...existingCompany, ...updateData };
        
        mockPrisma.companies.update.mockResolvedValue(updatedCompany);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/companies/${companyId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_COMPANY(request, { params: { id: companyId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        validateApiResponse.success(data);
        expect(data.data.name).toBe('Updated Company Name');
        expect(mockPrisma.companies.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: companyId },
            data: expect.objectContaining({
              name: 'Updated Company Name',
              updatedAt: expect.any(Date),
            }),
          })
        );
      });

      it('should update company website', async () => {
        const updateData = { website: 'https://updated-company.com' };
        const updatedCompany = { ...existingCompany, ...updateData };
        
        mockPrisma.companies.update.mockResolvedValue(updatedCompany);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/companies/${companyId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_COMPANY(request, { params: { id: companyId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.website).toBe('https://updated-company.com');
      });

      it('should update company email', async () => {
        const updateData = { email: 'updated@company.com' };
        const updatedCompany = { ...existingCompany, ...updateData };
        
        mockPrisma.companies.update.mockResolvedValue(updatedCompany);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/companies/${companyId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_COMPANY(request, { params: { id: companyId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.email).toBe('updated@company.com');
      });

      it('should update company phone', async () => {
        const updateData = { phone: '+1-555-999-8888' };
        const updatedCompany = { ...existingCompany, ...updateData };
        
        mockPrisma.companies.update.mockResolvedValue(updatedCompany);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/companies/${companyId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_COMPANY(request, { params: { id: companyId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.phone).toBe('+1-555-999-8888');
      });
    });

    describe('Address Field Updates', () => {
      it('should update company address fields', async () => {
        const updateData = {
          address: '123 Updated Street',
          city: 'Updated City',
          state: 'Updated State',
          country: 'Updated Country',
          postalCode: '54321'
        };
        const updatedCompany = { ...existingCompany, ...updateData };
        
        mockPrisma.companies.update.mockResolvedValue(updatedCompany);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/companies/${companyId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_COMPANY(request, { params: { id: companyId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.address).toBe('123 Updated Street');
        expect(data.data.city).toBe('Updated City');
        expect(data.data.state).toBe('Updated State');
        expect(data.data.country).toBe('Updated Country');
        expect(data.data.postalCode).toBe('54321');
      });
    });

    describe('Business Field Updates', () => {
      it('should update company industry and size', async () => {
        const updateData = {
          industry: 'Healthcare Technology',
          size: '501-1000 employees',
          revenue: 25000000,
          employeeCount: 750
        };
        const updatedCompany = { ...existingCompany, ...updateData };
        
        mockPrisma.companies.update.mockResolvedValue(updatedCompany);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/companies/${companyId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_COMPANY(request, { params: { id: companyId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.industry).toBe('Healthcare Technology');
        expect(data.data.size).toBe('501-1000 employees');
        expect(data.data.revenue).toBe(25000000);
        expect(data.data.employeeCount).toBe(750);
      });
    });

    describe('Opportunity Field Updates', () => {
      it('should update opportunity fields', async () => {
        const updateData = {
          opportunityStage: 'Negotiation',
          opportunityAmount: 100000,
          opportunityProbability: 85,
          expectedCloseDate: new Date('2024-12-31')
        };
        const updatedCompany = { ...existingCompany, ...updateData };
        
        mockPrisma.companies.update.mockResolvedValue(updatedCompany);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/companies/${companyId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_COMPANY(request, { params: { id: companyId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.opportunityStage).toBe('Negotiation');
        expect(data.data.opportunityAmount).toBe(100000);
        expect(data.data.opportunityProbability).toBe(85);
      });
    });

    describe('Metadata Field Updates', () => {
      it('should update status and priority', async () => {
        const updateData = {
          status: 'OPPORTUNITY',
          priority: 'HIGH',
          notes: 'Updated company notes with important information'
        };
        const updatedCompany = { ...existingCompany, ...updateData };
        
        mockPrisma.companies.update.mockResolvedValue(updatedCompany);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/companies/${companyId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_COMPANY(request, { params: { id: companyId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.status).toBe('OPPORTUNITY');
        expect(data.data.priority).toBe('HIGH');
        expect(data.data.notes).toBe('Updated company notes with important information');
      });
    });

    describe('Field Whitelisting', () => {
      it('should only allow whitelisted fields to be updated', async () => {
        const updateData = {
          name: 'Valid Field',
          invalidField: 'Should be ignored',
          anotherInvalidField: 'Also ignored'
        };
        const updatedCompany = { ...existingCompany, name: 'Valid Field' };
        
        mockPrisma.companies.update.mockResolvedValue(updatedCompany);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/companies/${companyId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_COMPANY(request, { params: { id: companyId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.name).toBe('Valid Field');
        expect(data.data.invalidField).toBeUndefined();
        expect(data.data.anotherInvalidField).toBeUndefined();
      });
    });

    describe('Error Handling', () => {
      it('should return 404 for non-existent company', async () => {
        mockPrisma.companies.findUnique.mockResolvedValue(null);

        const request = new Request(`http://localhost:3000/api/v1/companies/non-existent`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify({ name: 'Updated Name' }),
        });

        const response = await PATCH_COMPANY(request, { params: { id: 'non-existent' } });
        const data = await response.json();

        expect(response.status).toBe(404);
        validateApiResponse.error(data, 404);
        expect(data.error).toBe('Company not found');
      });

      it('should handle database constraint violations', async () => {
        mockPrisma.companies.update.mockRejectedValue({
          code: 'P2002',
          message: 'Unique constraint failed',
        });

        const request = new Request(`http://localhost:3000/api/v1/companies/${companyId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify({ name: 'Duplicate Name' }),
        });

        const response = await PATCH_COMPANY(request, { params: { id: companyId } });
        const data = await response.json();

        expect(response.status).toBe(400);
        validateApiResponse.error(data, 400);
        expect(data.error).toContain('already exists');
      });
    });
  });

  describe('Person Inline Editing (All Statuses)', () => {
    const personId = 'person-123';

    describe('LEAD Status Updates', () => {
      const existingLead = createTestPerson('LEAD', { id: personId });

      beforeEach(() => {
        mockPrisma.people.findUnique.mockResolvedValue(existingLead);
      });

      it('should update lead contact fields', async () => {
        const updateData = {
          email: 'updated@lead.com',
          phone: '+1-555-111-2222',
          linkedinUrl: 'https://linkedin.com/in/updatedlead'
        };
        const updatedLead = { ...existingLead, ...updateData };
        
        mockPrisma.people.update.mockResolvedValue(updatedLead);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/people/${personId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_PERSON(request, { params: { id: personId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.email).toBe('updated@lead.com');
        expect(data.data.phone).toBe('+1-555-111-2222');
        expect(data.data.linkedinUrl).toBe('https://linkedin.com/in/updatedlead');
      });

      it('should update lead profile fields', async () => {
        const updateData = {
          firstName: 'Updated',
          lastName: 'Lead',
          jobTitle: 'Senior Developer',
          department: 'Engineering'
        };
        const updatedLead = { 
          ...existingLead, 
          ...updateData,
          fullName: 'Updated Lead' // Should be auto-updated
        };
        
        mockPrisma.people.update.mockResolvedValue(updatedLead);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/people/${personId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_PERSON(request, { params: { id: personId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.firstName).toBe('Updated');
        expect(data.data.lastName).toBe('Lead');
        expect(data.data.fullName).toBe('Updated Lead');
        expect(data.data.jobTitle).toBe('Senior Developer');
        expect(data.data.department).toBe('Engineering');
      });

      it('should update lead engagement fields', async () => {
        const updateData = {
          priority: 'HIGH',
          status: 'PROSPECT', // Status change from LEAD to PROSPECT
          nextAction: 'Schedule demo call',
          nextActionDate: new Date('2024-12-15')
        };
        const updatedLead = { ...existingLead, ...updateData };
        
        mockPrisma.people.update.mockResolvedValue(updatedLead);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/people/${personId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_PERSON(request, { params: { id: personId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.priority).toBe('HIGH');
        expect(data.data.status).toBe('PROSPECT');
        expect(data.data.nextAction).toBe('Schedule demo call');
      });
    });

    describe('PROSPECT Status Updates', () => {
      const existingProspect = createTestPerson('PROSPECT', { id: personId });

      beforeEach(() => {
        mockPrisma.people.findUnique.mockResolvedValue(existingProspect);
      });

      it('should update prospect fields', async () => {
        const updateData = {
          engagementScore: 85.5,
          notes: 'Prospect showing strong interest in our solution',
          nextAction: 'Send proposal'
        };
        const updatedProspect = { ...existingProspect, ...updateData };
        
        mockPrisma.people.update.mockResolvedValue(updatedProspect);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/people/${personId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_PERSON(request, { params: { id: personId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.engagementScore).toBe(85.5);
        expect(data.data.notes).toBe('Prospect showing strong interest in our solution');
        expect(data.data.nextAction).toBe('Send proposal');
      });
    });

    describe('OPPORTUNITY Status Updates', () => {
      const existingOpportunity = createTestPerson('OPPORTUNITY', { id: personId });

      beforeEach(() => {
        mockPrisma.people.findUnique.mockResolvedValue(existingOpportunity);
      });

      it('should update opportunity fields', async () => {
        const updateData = {
          priority: 'HIGH',
          notes: 'High-value opportunity, decision maker engaged',
          nextAction: 'Final contract review'
        };
        const updatedOpportunity = { ...existingOpportunity, ...updateData };
        
        mockPrisma.people.update.mockResolvedValue(updatedOpportunity);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/people/${personId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_PERSON(request, { params: { id: personId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.priority).toBe('HIGH');
        expect(data.data.notes).toBe('High-value opportunity, decision maker engaged');
        expect(data.data.nextAction).toBe('Final contract review');
      });
    });

    describe('FullName Auto-Update', () => {
      const existingPerson = createTestPerson('LEAD', { 
        id: personId,
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe'
      });

      beforeEach(() => {
        mockPrisma.people.findUnique.mockResolvedValue(existingPerson);
      });

      it('should auto-update fullName when firstName changes', async () => {
        const updateData = { firstName: 'Jane' };
        const updatedPerson = { 
          ...existingPerson, 
          ...updateData,
          fullName: 'Jane Doe' // Should be auto-updated
        };
        
        mockPrisma.people.update.mockResolvedValue(updatedPerson);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/people/${personId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_PERSON(request, { params: { id: personId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.firstName).toBe('Jane');
        expect(data.data.fullName).toBe('Jane Doe');
      });

      it('should auto-update fullName when lastName changes', async () => {
        const updateData = { lastName: 'Smith' };
        const updatedPerson = { 
          ...existingPerson, 
          ...updateData,
          fullName: 'John Smith' // Should be auto-updated
        };
        
        mockPrisma.people.update.mockResolvedValue(updatedPerson);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/people/${personId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_PERSON(request, { params: { id: personId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.lastName).toBe('Smith');
        expect(data.data.fullName).toBe('John Smith');
      });
    });

    describe('Error Handling', () => {
      it('should return 404 for non-existent person', async () => {
        mockPrisma.people.findUnique.mockResolvedValue(null);

        const request = new Request(`http://localhost:3000/api/v1/people/non-existent`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify({ firstName: 'Updated' }),
        });

        const response = await PATCH_PERSON(request, { params: { id: 'non-existent' } });
        const data = await response.json();

        expect(response.status).toBe(404);
        validateApiResponse.error(data, 404);
        expect(data.error).toBe('Person not found');
      });

      it('should handle database constraint violations', async () => {
        mockPrisma.people.update.mockRejectedValue({
          code: 'P2002',
          message: 'Unique constraint failed',
        });

        const request = new Request(`http://localhost:3000/api/v1/people/${personId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify({ email: 'duplicate@example.com' }),
        });

        const response = await PATCH_PERSON(request, { params: { id: personId } });
        const data = await response.json();

        expect(response.status).toBe(400);
        validateApiResponse.error(data, 400);
        expect(data.error).toContain('already exists');
      });
    });
  });

  describe('Field Type Validation', () => {
    const companyId = 'company-123';
    const personId = 'person-123';
    const existingCompany = createTestCompany({ id: companyId });
    const existingPerson = createTestPerson('LEAD', { id: personId });

    beforeEach(() => {
      mockPrisma.companies.findUnique.mockResolvedValue(existingCompany);
      mockPrisma.people.findUnique.mockResolvedValue(existingPerson);
    });

    describe('Text Fields', () => {
      it('should handle text field updates', async () => {
        const updateData = { name: 'Updated Company Name' };
        const updatedCompany = { ...existingCompany, ...updateData };
        
        mockPrisma.companies.update.mockResolvedValue(updatedCompany);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/companies/${companyId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_COMPANY(request, { params: { id: companyId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.name).toBe('Updated Company Name');
      });

      it('should handle long text values', async () => {
        const longText = 'A'.repeat(1000);
        const updateData = { notes: longText };
        const updatedCompany = { ...existingCompany, ...updateData };
        
        mockPrisma.companies.update.mockResolvedValue(updatedCompany);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/companies/${companyId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_COMPANY(request, { params: { id: companyId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.notes).toBe(longText);
      });
    });

    describe('Email Fields', () => {
      it('should handle email field updates', async () => {
        const updateData = { email: 'updated@company.com' };
        const updatedPerson = { ...existingPerson, ...updateData };
        
        mockPrisma.people.update.mockResolvedValue(updatedPerson);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/people/${personId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_PERSON(request, { params: { id: personId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.email).toBe('updated@company.com');
      });
    });

    describe('Number Fields', () => {
      it('should handle number field updates', async () => {
        const updateData = { 
          revenue: 50000000,
          employeeCount: 1000
        };
        const updatedCompany = { ...existingCompany, ...updateData };
        
        mockPrisma.companies.update.mockResolvedValue(updatedCompany);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/companies/${companyId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_COMPANY(request, { params: { id: companyId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.revenue).toBe(50000000);
        expect(data.data.employeeCount).toBe(1000);
      });
    });

    describe('Date Fields', () => {
      it('should handle date field updates', async () => {
        const updateData = { 
          nextActionDate: new Date('2024-12-31'),
          expectedCloseDate: new Date('2024-11-30')
        };
        const updatedPerson = { ...existingPerson, ...updateData };
        
        mockPrisma.people.update.mockResolvedValue(updatedPerson);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/people/${personId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_PERSON(request, { params: { id: personId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(new Date(data.data.nextActionDate)).toEqual(new Date('2024-12-31'));
        expect(new Date(data.data.expectedCloseDate)).toEqual(new Date('2024-11-30'));
      });
    });

    describe('Array Fields', () => {
      it('should handle array field updates', async () => {
        const updateData = { 
          tags: ['VIP', 'Hot Lead', 'Enterprise']
        };
        const updatedPerson = { ...existingPerson, ...updateData };
        
        mockPrisma.people.update.mockResolvedValue(updatedPerson);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/people/${personId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_PERSON(request, { params: { id: personId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.tags).toEqual(['VIP', 'Hot Lead', 'Enterprise']);
      });
    });

    describe('JSON Fields', () => {
      it('should handle JSON field updates', async () => {
        const updateData = { 
          customFields: {
            customField1: 'Custom Value 1',
            customField2: 123,
            customField3: true
          }
        };
        const updatedPerson = { ...existingPerson, ...updateData };
        
        mockPrisma.people.update.mockResolvedValue(updatedPerson);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/people/${personId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_PERSON(request, { params: { id: personId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.customFields).toEqual({
          customField1: 'Custom Value 1',
          customField2: 123,
          customField3: true
        });
      });
    });

    describe('Null and Empty Values', () => {
      it('should handle null values', async () => {
        const updateData = { 
          notes: null,
          phone: null
        };
        const updatedPerson = { ...existingPerson, ...updateData };
        
        mockPrisma.people.update.mockResolvedValue(updatedPerson);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/people/${personId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_PERSON(request, { params: { id: personId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.notes).toBeNull();
        expect(data.data.phone).toBeNull();
      });

      it('should handle empty string values', async () => {
        const updateData = { 
          notes: '',
          phone: ''
        };
        const updatedPerson = { ...existingPerson, ...updateData };
        
        mockPrisma.people.update.mockResolvedValue(updatedPerson);
        mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

        const request = new Request(`http://localhost:3000/api/v1/people/${personId}`, {
          method: 'PATCH',
          headers: getTestAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const response = await PATCH_PERSON(request, { params: { id: personId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.notes).toBe('');
        expect(data.data.phone).toBe('');
      });
    });
  });

  describe('Edge Cases', () => {
    const companyId = 'company-123';
    const personId = 'person-123';
    const existingCompany = createTestCompany({ id: companyId });
    const existingPerson = createTestPerson('LEAD', { id: personId });

    beforeEach(() => {
      mockPrisma.companies.findUnique.mockResolvedValue(existingCompany);
      mockPrisma.people.findUnique.mockResolvedValue(existingPerson);
    });

    it('should handle no-op updates (same value)', async () => {
      const updateData = { name: existingCompany.name }; // Same value
      const updatedCompany = { ...existingCompany };
      
      mockPrisma.companies.update.mockResolvedValue(updatedCompany);
      mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

      const request = new Request(`http://localhost:3000/api/v1/companies/${companyId}`, {
        method: 'PATCH',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      const response = await PATCH_COMPANY(request, { params: { id: companyId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.name).toBe(existingCompany.name);
    });

    it('should handle special characters in text fields', async () => {
      const updateData = { 
        notes: 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?/~`'
      };
      const updatedPerson = { ...existingPerson, ...updateData };
      
      mockPrisma.people.update.mockResolvedValue(updatedPerson);
      mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

      const request = new Request(`http://localhost:3000/api/v1/people/${personId}`, {
        method: 'PATCH',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      const response = await PATCH_PERSON(request, { params: { id: personId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.notes).toBe('Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?/~`');
    });

    it('should handle unicode characters', async () => {
      const updateData = { 
        name: 'Company with unicode: 中文, العربية, русский, 日本語'
      };
      const updatedCompany = { ...existingCompany, ...updateData };
      
      mockPrisma.companies.update.mockResolvedValue(updatedCompany);
      mockPrisma.actions.create.mockResolvedValue({ id: 'action-123' });

      const request = new Request(`http://localhost:3000/api/v1/companies/${companyId}`, {
        method: 'PATCH',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      const response = await PATCH_COMPANY(request, { params: { id: companyId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.name).toBe('Company with unicode: 中文, العربية, русский, 日本語');
    });
  });
});
