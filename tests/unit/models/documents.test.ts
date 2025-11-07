import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

const prisma = new PrismaClient();

describe('Documents Model - Unit Tests', () => {
  let testWorkspaceId: string;
  let testUserId: string;
  let testCompanyId: string;
  let testPersonId: string;
  let createdTestData = false;

  beforeAll(async () => {
    // Try to use existing workspace for testing
    const existingWorkspace = await prisma.workspaces.findFirst({
      where: { isActive: true }
    });
    
    const existingUser = await prisma.users.findFirst();
    const existingCompany = await prisma.companies.findFirst();

    if (existingWorkspace && existingUser && existingCompany) {
      // Use existing data
      testWorkspaceId = existingWorkspace.id;
      testUserId = existingUser.id;
      testCompanyId = existingCompany.id;
      
      const existingPerson = await prisma.people.findFirst({
        where: { workspaceId: testWorkspaceId }
      });
      testPersonId = existingPerson?.id || '';
      
      console.log('Using existing test data');
      return;
    }

    // Create test workspace if none exists
    try {
      const workspace = await prisma.workspaces.create({
        data: {
          name: 'Test Workspace',
          slug: `test-workspace-${Date.now()}`,
          isActive: true,
        },
      });
      testWorkspaceId = workspace.id;
      createdTestData = true;

    // Create test user
    const user = await prisma.users.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        activeWorkspaceId: testWorkspaceId,
      },
    });
    testUserId = user.id;

    // Create test company
    const company = await prisma.companies.create({
      data: {
        workspaceId: testWorkspaceId,
        name: 'Test Company',
      },
    });
    testCompanyId = company.id;

    // Create test person
    const person = await prisma.people.create({
      data: {
        workspaceId: testWorkspaceId,
        companyId: testCompanyId,
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
      },
    });
    testPersonId = person.id;
    } catch (error) {
      console.error('Failed to create test data:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Cleanup only if we created test data
    await prisma.documents.deleteMany({ where: { workspaceId: testWorkspaceId } });
    
    if (createdTestData) {
      await prisma.people.deleteMany({ where: { workspaceId: testWorkspaceId } });
      await prisma.companies.deleteMany({ where: { workspaceId: testWorkspaceId } });
      await prisma.users.deleteMany({ where: { id: testUserId } });
      await prisma.workspaces.delete({ where: { id: testWorkspaceId } });
    }
    
    await prisma.$disconnect();
  });

  describe('Document Creation', () => {
    it('should create a document with required fields', async () => {
      const document = await prisma.documents.create({
        data: {
          workspaceId: testWorkspaceId,
          userId: testUserId,
          companyId: testCompanyId,
          documentType: 'proposal',
          title: 'Q1 2025 Proposal',
        },
      });

      expect(document).toBeDefined();
      expect(document.id).toBeDefined();
      expect(document.documentType).toBe('proposal');
      expect(document.title).toBe('Q1 2025 Proposal');
      expect(document.status).toBe('draft'); // default value
      expect(document.viewCount).toBe(0); // default value
    });

    it('should create a document with all optional fields', async () => {
      const document = await prisma.documents.create({
        data: {
          workspaceId: testWorkspaceId,
          userId: testUserId,
          companyId: testCompanyId,
          personId: testPersonId,
          documentType: 'contract',
          title: 'Service Agreement 2025',
          description: 'Annual service contract',
          fileUrl: 'https://storage.example.com/contract.pdf',
          fileSize: 1024000,
          fileType: 'application/pdf',
          status: 'sent',
          sentAt: new Date(),
          proposedValue: 50000.00,
          currency: 'USD',
          externalId: 'docusign-123',
          provider: 'docusign',
          metadata: { customField: 'value' },
        },
      });

      expect(document).toBeDefined();
      expect(document.personId).toBe(testPersonId);
      expect(document.description).toBe('Annual service contract');
      expect(document.proposedValue).not.toBeNull();
      expect(document.currency).toBe('USD');
      expect(document.provider).toBe('docusign');
    });
  });

  describe('Document Status Tracking', () => {
    it('should track document view status', async () => {
      const document = await prisma.documents.create({
        data: {
          workspaceId: testWorkspaceId,
          userId: testUserId,
          companyId: testCompanyId,
          documentType: 'proposal',
          title: 'Proposal with Views',
          status: 'sent',
          sentAt: new Date(),
        },
      });

      // Update with first view
      const firstView = new Date();
      await prisma.documents.update({
        where: { id: document.id },
        data: {
          status: 'viewed',
          firstViewedAt: firstView,
          lastViewedAt: firstView,
          viewCount: 1,
        },
      });

      const viewed = await prisma.documents.findUnique({
        where: { id: document.id },
      });

      expect(viewed?.status).toBe('viewed');
      expect(viewed?.firstViewedAt).toEqual(firstView);
      expect(viewed?.viewCount).toBe(1);

      // Update with subsequent view
      const secondView = new Date();
      await prisma.documents.update({
        where: { id: document.id },
        data: {
          lastViewedAt: secondView,
          viewCount: { increment: 1 },
        },
      });

      const reViewed = await prisma.documents.findUnique({
        where: { id: document.id },
      });

      expect(reViewed?.viewCount).toBe(2);
      expect(reViewed?.firstViewedAt).toEqual(firstView);
      expect(reViewed?.lastViewedAt).toEqual(secondView);
    });

    it('should track document signing', async () => {
      const document = await prisma.documents.create({
        data: {
          workspaceId: testWorkspaceId,
          userId: testUserId,
          companyId: testCompanyId,
          documentType: 'contract',
          title: 'Contract to be Signed',
          status: 'viewed',
        },
      });

      const signedAt = new Date();
      await prisma.documents.update({
        where: { id: document.id },
        data: {
          status: 'signed',
          signedAt,
        },
      });

      const signed = await prisma.documents.findUnique({
        where: { id: document.id },
      });

      expect(signed?.status).toBe('signed');
      expect(signed?.signedAt).toEqual(signedAt);
    });
  });

  describe('Document Relationships', () => {
    it('should link document to company and person', async () => {
      const document = await prisma.documents.create({
        data: {
          workspaceId: testWorkspaceId,
          userId: testUserId,
          companyId: testCompanyId,
          personId: testPersonId,
          documentType: 'proposal',
          title: 'Linked Proposal',
        },
        include: {
          company: true,
          person: true,
          user: true,
        },
      });

      expect(document.company).toBeDefined();
      expect(document.company?.name).toBe('Test Company');
      expect(document.person).toBeDefined();
      expect(document.person?.fullName).toBe('John Doe');
      expect(document.user).toBeDefined();
    });

    it('should cascade delete when company is deleted', async () => {
      const company = await prisma.companies.create({
        data: {
          workspaceId: testWorkspaceId,
          name: 'Temp Company',
        },
      });

      const document = await prisma.documents.create({
        data: {
          workspaceId: testWorkspaceId,
          userId: testUserId,
          companyId: company.id,
          documentType: 'proposal',
          title: 'Temp Proposal',
        },
      });

      // Delete company - document should be deleted too
      await prisma.companies.delete({ where: { id: company.id } });

      const deletedDoc = await prisma.documents.findUnique({
        where: { id: document.id },
      });

      expect(deletedDoc).toBeNull();
    });
  });

  describe('Document Queries', () => {
    beforeEach(async () => {
      // Clean up documents before each test
      await prisma.documents.deleteMany({
        where: { workspaceId: testWorkspaceId },
      });
    });

    it('should query documents by status', async () => {
      await prisma.documents.createMany({
        data: [
          {
            workspaceId: testWorkspaceId,
            userId: testUserId,
            companyId: testCompanyId,
            documentType: 'proposal',
            title: 'Draft Proposal',
            status: 'draft',
          },
          {
            workspaceId: testWorkspaceId,
            userId: testUserId,
            companyId: testCompanyId,
            documentType: 'proposal',
            title: 'Sent Proposal',
            status: 'sent',
          },
          {
            workspaceId: testWorkspaceId,
            userId: testUserId,
            companyId: testCompanyId,
            documentType: 'proposal',
            title: 'Signed Proposal',
            status: 'signed',
          },
        ],
      });

      const sentDocs = await prisma.documents.findMany({
        where: {
          workspaceId: testWorkspaceId,
          status: 'sent',
        },
      });

      expect(sentDocs).toHaveLength(1);
      expect(sentDocs[0].title).toBe('Sent Proposal');
    });

    it('should query documents by type', async () => {
      await prisma.documents.createMany({
        data: [
          {
            workspaceId: testWorkspaceId,
            userId: testUserId,
            companyId: testCompanyId,
            documentType: 'proposal',
            title: 'Proposal 1',
          },
          {
            workspaceId: testWorkspaceId,
            userId: testUserId,
            companyId: testCompanyId,
            documentType: 'contract',
            title: 'Contract 1',
          },
        ],
      });

      const proposals = await prisma.documents.findMany({
        where: {
          workspaceId: testWorkspaceId,
          documentType: 'proposal',
        },
      });

      expect(proposals).toHaveLength(1);
      expect(proposals[0].documentType).toBe('proposal');
    });

    it('should query documents by company', async () => {
      const company2 = await prisma.companies.create({
        data: {
          workspaceId: testWorkspaceId,
          name: 'Company 2',
        },
      });

      await prisma.documents.createMany({
        data: [
          {
            workspaceId: testWorkspaceId,
            userId: testUserId,
            companyId: testCompanyId,
            documentType: 'proposal',
            title: 'Company 1 Proposal',
          },
          {
            workspaceId: testWorkspaceId,
            userId: testUserId,
            companyId: company2.id,
            documentType: 'proposal',
            title: 'Company 2 Proposal',
          },
        ],
      });

      const company1Docs = await prisma.documents.findMany({
        where: {
          workspaceId: testWorkspaceId,
          companyId: testCompanyId,
        },
      });

      expect(company1Docs).toHaveLength(1);
      expect(company1Docs[0].title).toBe('Company 1 Proposal');

      // Cleanup
      await prisma.companies.delete({ where: { id: company2.id } });
    });
  });

  describe('Document Indexes', () => {
    it('should efficiently query by workspace and sent date', async () => {
      const start = Date.now();

      await prisma.documents.findMany({
        where: {
          workspaceId: testWorkspaceId,
          sentAt: {
            gte: new Date('2025-01-01'),
          },
        },
      });

      const duration = Date.now() - start;
      // Query should be fast with index
      expect(duration).toBeLessThan(100);
    });

    it('should efficiently query by company and status', async () => {
      const start = Date.now();

      await prisma.documents.findMany({
        where: {
          companyId: testCompanyId,
          status: 'sent',
        },
      });

      const duration = Date.now() - start;
      // Query should be fast with index
      expect(duration).toBeLessThan(100);
    });
  });
});

