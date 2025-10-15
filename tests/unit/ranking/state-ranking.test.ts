/**
 * State-Based Ranking System Tests
 * 
 * Comprehensive tests for the state-based ranking functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { StateRankingService } from '@/products/speedrun/state-ranking';
import { rankContacts, rankContactsByState } from '@/products/speedrun/ranking';
import { getDefaultUserSettings } from '@/products/speedrun/state';
import type { CRMRecord, RankedContact } from '@/products/speedrun/ranking';
import type { StateRankingData, StateRankingValidation } from '@/products/speedrun/types/StateRankingTypes';

// Mock Prisma client
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

describe('State-Based Ranking System', () => {
  const mockWorkspaceId = 'test-workspace-123';
  const mockUserId = 'test-user-456';
  let stateRankingService: StateRankingService;

  beforeEach(() => {
    jest.clearAllMocks();
    stateRankingService = new StateRankingService(mockWorkspaceId, mockUserId);
  });

  describe('StateRankingService', () => {
    describe('getStatesFromWorkspace', () => {
      it('should return states with company and people counts', async () => {
        // Mock company data with state information
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
            hqState: 'CA',
            _count: { people: 3 }
          },
          {
            id: 'company-3',
            name: 'Gamma LLC',
            hqState: 'NY',
            _count: { people: 8 }
          },
          {
            id: 'company-4',
            name: 'Delta Corp',
            hqState: null, // No state data
            _count: { people: 2 }
          }
        ];

        mockPrisma.companies.findMany.mockResolvedValue(mockCompanies);
        mockPrisma.companies.count.mockResolvedValue(4);

        const result = await stateRankingService.getStatesFromWorkspace();

        expect(result.stateRankings).toHaveLength(2);
        expect(result.stateRankings).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              state: 'CA',
              companyCount: 2,
              peopleCount: 8,
              companies: expect.arrayContaining([
                expect.objectContaining({ id: 'company-1', name: 'Acme Corp', peopleCount: 5 }),
                expect.objectContaining({ id: 'company-2', name: 'Beta Inc', peopleCount: 3 })
              ])
            }),
            expect.objectContaining({
              state: 'NY',
              companyCount: 1,
              peopleCount: 8,
              companies: expect.arrayContaining([
                expect.objectContaining({ id: 'company-3', name: 'Gamma LLC', peopleCount: 8 })
              ])
            })
          ])
        );

        expect(result.validation).toEqual({
          isValid: true, // 75% coverage (3/4 companies have state data)
          hasStateData: true,
          stateDataPercentage: 75,
          missingStates: [],
          totalCompanies: 4,
          companiesWithState: 3
        });
      });

      it('should return invalid validation when state data coverage is low', async () => {
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
            hqState: null,
            _count: { people: 3 }
          },
          {
            id: 'company-3',
            name: 'Gamma LLC',
            hqState: null,
            _count: { people: 8 }
          },
          {
            id: 'company-4',
            name: 'Delta Corp',
            hqState: null,
            _count: { people: 2 }
          }
        ];

        mockPrisma.companies.findMany.mockResolvedValue(mockCompanies);
        mockPrisma.companies.count.mockResolvedValue(4);

        const result = await stateRankingService.getStatesFromWorkspace();

        expect(result.validation).toEqual({
          isValid: false, // 25% coverage (1/4 companies have state data)
          hasStateData: true,
          stateDataPercentage: 25,
          missingStates: [],
          totalCompanies: 4,
          companiesWithState: 1
        });
      });

      it('should handle empty workspace gracefully', async () => {
        mockPrisma.companies.findMany.mockResolvedValue([]);
        mockPrisma.companies.count.mockResolvedValue(0);

        const result = await stateRankingService.getStatesFromWorkspace();

        expect(result.stateRankings).toHaveLength(0);
        expect(result.validation).toEqual({
          isValid: false,
          hasStateData: false,
          stateDataPercentage: 0,
          missingStates: [],
          totalCompanies: 0,
          companiesWithState: 0
        });
      });
    });

    describe('validateStateData', () => {
      it('should return validation result', async () => {
        const mockCompanies = [
          { id: 'company-1', name: 'Acme Corp', hqState: 'CA', _count: { people: 5 } },
          { id: 'company-2', name: 'Beta Inc', hqState: 'NY', _count: { people: 3 } }
        ];

        mockPrisma.companies.findMany.mockResolvedValue(mockCompanies);
        mockPrisma.companies.count.mockResolvedValue(2);

        const validation = await stateRankingService.validateStateData();

        expect(validation.isValid).toBe(true);
        expect(validation.stateDataPercentage).toBe(100);
      });
    });

    describe('isStateBasedRankingAvailable', () => {
      it('should return true when state data is sufficient', async () => {
        const mockCompanies = [
          { id: 'company-1', name: 'Acme Corp', hqState: 'CA', _count: { people: 5 } },
          { id: 'company-2', name: 'Beta Inc', hqState: 'NY', _count: { people: 3 } }
        ];

        mockPrisma.companies.findMany.mockResolvedValue(mockCompanies);
        mockPrisma.companies.count.mockResolvedValue(2);

        const isAvailable = await stateRankingService.isStateBasedRankingAvailable();

        expect(isAvailable).toBe(true);
      });

      it('should return false when state data is insufficient', async () => {
        const mockCompanies = [
          { id: 'company-1', name: 'Acme Corp', hqState: 'CA', _count: { people: 5 } },
          { id: 'company-2', name: 'Beta Inc', hqState: null, _count: { people: 3 } },
          { id: 'company-3', name: 'Gamma LLC', hqState: null, _count: { people: 8 } }
        ];

        mockPrisma.companies.findMany.mockResolvedValue(mockCompanies);
        mockPrisma.companies.count.mockResolvedValue(3);

        const isAvailable = await stateRankingService.isStateBasedRankingAvailable();

        expect(isAvailable).toBe(false);
      });
    });
  });

  describe('rankContactsByState', () => {
    const mockContacts: CRMRecord[] = [
      {
        id: 1,
        name: 'John Doe',
        title: 'CEO',
        company: { id: 'company-1', name: 'Acme Corp', hqState: 'CA' },
        email: 'john@acme.com',
        phone: '555-0001',
        photo: null,
        priority: 'High',
        status: 'Lead',
        lastContact: '2024-01-01',
        nextAction: 'Call',
        relationship: 'New',
        bio: 'CEO of Acme Corp',
        interests: ['Technology'],
        recentActivity: 'Company expansion',
        commission: '5%'
      },
      {
        id: 2,
        name: 'Jane Smith',
        title: 'CTO',
        company: { id: 'company-1', name: 'Acme Corp', hqState: 'CA' },
        email: 'jane@acme.com',
        phone: '555-0002',
        photo: null,
        priority: 'Medium',
        status: 'Lead',
        lastContact: '2024-01-02',
        nextAction: 'Email',
        relationship: 'New',
        bio: 'CTO of Acme Corp',
        interests: ['Innovation'],
        recentActivity: 'Product launch',
        commission: '3%'
      },
      {
        id: 3,
        name: 'Bob Johnson',
        title: 'VP Sales',
        company: { id: 'company-2', name: 'Beta Inc', hqState: 'NY' },
        email: 'bob@beta.com',
        phone: '555-0003',
        photo: null,
        priority: 'High',
        status: 'Lead',
        lastContact: '2024-01-03',
        nextAction: 'Meeting',
        relationship: 'New',
        bio: 'VP Sales at Beta Inc',
        interests: ['Sales'],
        recentActivity: 'Q4 planning',
        commission: '4%'
      }
    ];

    it('should rank contacts by state hierarchy', () => {
      const settings = getDefaultUserSettings('AE');
      const stateOrder = ['CA', 'NY']; // California first, then New York

      const rankedContacts = rankContactsByState(mockContacts, settings, stateOrder);

      expect(rankedContacts).toHaveLength(3);

      // Check that CA contacts come before NY contacts
      const caContacts = rankedContacts.filter(c => c.state === 'CA');
      const nyContacts = rankedContacts.filter(c => c.state === 'NY');

      expect(caContacts).toHaveLength(2);
      expect(nyContacts).toHaveLength(1);

      // All CA contacts should have lower state rank than NY contacts
      caContacts.forEach(caContact => {
        nyContacts.forEach(nyContact => {
          expect(caContact.stateRank).toBeLessThan(nyContact.stateRank!);
        });
      });

      // Check that state-based ranking fields are populated
      rankedContacts.forEach(contact => {
        expect(contact.stateRank).toBeDefined();
        expect(contact.companyRankInState).toBeDefined();
        expect(contact.personRankInCompany).toBeDefined();
        expect(contact.rankingMode).toBe('state-based');
      });
    });

    it('should handle contacts without state data', () => {
      const contactsWithoutState: CRMRecord[] = [
        {
          id: 1,
          name: 'John Doe',
          title: 'CEO',
          company: 'Acme Corp', // String instead of object
          email: 'john@acme.com',
          phone: '555-0001',
          photo: null,
          priority: 'High',
          status: 'Lead',
          lastContact: '2024-01-01',
          nextAction: 'Call',
          relationship: 'New',
          bio: 'CEO of Acme Corp',
          interests: ['Technology'],
          recentActivity: 'Company expansion',
          commission: '5%'
        }
      ];

      const settings = getDefaultUserSettings('AE');
      const rankedContacts = rankContactsByState(contactsWithoutState, settings);

      expect(rankedContacts).toHaveLength(1);
      expect(rankedContacts[0].state).toBe('Unknown');
      expect(rankedContacts[0].stateRank).toBeDefined();
    });

    it('should use default state ordering when none provided', () => {
      const settings = getDefaultUserSettings('AE');
      const rankedContacts = rankContactsByState(mockContacts, settings);

      expect(rankedContacts).toHaveLength(3);
      
      // Should be ordered alphabetically by state (CA, NY)
      const states = rankedContacts.map(c => c.state);
      const uniqueStates = [...new Set(states)];
      expect(uniqueStates).toEqual(['CA', 'NY']);
    });

    it('should apply custom state ordering', () => {
      const settings = getDefaultUserSettings('AE');
      const stateOrder = ['NY', 'CA']; // New York first, then California

      const rankedContacts = rankContactsByState(mockContacts, settings, stateOrder);

      expect(rankedContacts).toHaveLength(3);

      // NY contacts should come before CA contacts
      const nyContacts = rankedContacts.filter(c => c.state === 'NY');
      const caContacts = rankedContacts.filter(c => c.state === 'CA');

      expect(nyContacts[0].stateRank).toBe(1);
      expect(caContacts[0].stateRank).toBe(2);
    });
  });

  describe('rankContacts with state-based mode', () => {
    const mockContacts: CRMRecord[] = [
      {
        id: 1,
        name: 'John Doe',
        title: 'CEO',
        company: { id: 'company-1', name: 'Acme Corp', hqState: 'CA' },
        email: 'john@acme.com',
        phone: '555-0001',
        photo: null,
        priority: 'High',
        status: 'Lead',
        lastContact: '2024-01-01',
        nextAction: 'Call',
        relationship: 'New',
        bio: 'CEO of Acme Corp',
        interests: ['Technology'],
        recentActivity: 'Company expansion',
        commission: '5%'
      }
    ];

    it('should use state-based ranking when mode is state-based', () => {
      const settings = getDefaultUserSettings('AE');
      const stateOrder = ['CA'];

      const rankedContacts = rankContacts(mockContacts, settings, 'state-based', stateOrder);

      expect(rankedContacts).toHaveLength(1);
      expect(rankedContacts[0].rankingMode).toBe('state-based');
      expect(rankedContacts[0].stateRank).toBeDefined();
    });

    it('should use global ranking when mode is global', () => {
      const settings = getDefaultUserSettings('AE');

      const rankedContacts = rankContacts(mockContacts, settings, 'global');

      expect(rankedContacts).toHaveLength(1);
      expect(rankedContacts[0].rankingMode).toBe('global'); // Global mode sets this field
      expect(rankedContacts[0].stateRank).toBeUndefined();
    });

    it('should default to global ranking when no mode specified', () => {
      const settings = getDefaultUserSettings('AE');

      const rankedContacts = rankContacts(mockContacts, settings);

      expect(rankedContacts).toHaveLength(1);
      expect(rankedContacts[0].stateRank).toBeUndefined();
    });
  });

  describe('State ranking validation edge cases', () => {
    it('should handle companies with empty state strings', async () => {
      const mockCompanies = [
        { id: 'company-1', name: 'Acme Corp', hqState: '', _count: { people: 5 } },
        { id: 'company-2', name: 'Beta Inc', hqState: 'CA', _count: { people: 3 } }
      ];

      mockPrisma.companies.findMany.mockResolvedValue(mockCompanies);
      mockPrisma.companies.count.mockResolvedValue(2);

      const result = await stateRankingService.getStatesFromWorkspace();

      expect(result.stateRankings).toHaveLength(1);
      expect(result.stateRankings[0].state).toBe('CA');
      expect(result.validation.stateDataPercentage).toBe(50);
    });

    it('should handle duplicate state entries', async () => {
      const mockCompanies = [
        { id: 'company-1', name: 'Acme Corp', hqState: 'CA', _count: { people: 5 } },
        { id: 'company-2', name: 'Beta Inc', hqState: 'CA', _count: { people: 3 } },
        { id: 'company-3', name: 'Gamma LLC', hqState: 'CA', _count: { people: 8 } }
      ];

      mockPrisma.companies.findMany.mockResolvedValue(mockCompanies);
      mockPrisma.companies.count.mockResolvedValue(3);

      const result = await stateRankingService.getStatesFromWorkspace();

      expect(result.stateRankings).toHaveLength(1);
      expect(result.stateRankings[0].state).toBe('CA');
      expect(result.stateRankings[0].companyCount).toBe(3);
      expect(result.stateRankings[0].peopleCount).toBe(16);
    });
  });
});
