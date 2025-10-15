/**
 * Speedrun Engine Tests
 * 
 * Comprehensive tests for the speedrun engine functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { rankContacts } from '@/products/speedrun/ranking';
import { getDefaultUserSettings } from '@/products/speedrun/state';
import type { CRMRecord, RankedContact } from '@/products/speedrun/ranking';

describe('Speedrun Engine', () => {
  let mockContacts: CRMRecord[];

  beforeEach(() => {
    mockContacts = [
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
      },
      {
        id: 4,
        name: 'Alice Brown',
        title: 'Marketing Director',
        company: { id: 'company-3', name: 'Gamma LLC', hqState: 'TX' },
        email: 'alice@gamma.com',
        phone: '555-0004',
        photo: null,
        priority: 'Low',
        status: 'Prospect',
        lastContact: '2024-01-04',
        nextAction: 'Follow up',
        relationship: 'Warm',
        bio: 'Marketing Director at Gamma LLC',
        interests: ['Marketing'],
        recentActivity: 'Campaign launch',
        commission: '2%'
      }
    ];
  });

  describe('Global Ranking', () => {
    it('should rank contacts globally by company value and individual score', () => {
      const settings = getDefaultUserSettings('AE');
      const rankedContacts = rankContacts(mockContacts, settings, 'global');

      expect(rankedContacts).toHaveLength(4);
      
      // All contacts should have ranking scores
      rankedContacts.forEach(contact => {
        expect(contact.rankingScore).toBeDefined();
        expect(contact.rankingScore).toBeGreaterThan(0);
      });

      // Contacts should be sorted by ranking score (highest first)
      for (let i = 0; i < rankedContacts.length - 1; i++) {
        expect(rankedContacts[i].rankingScore).toBeGreaterThanOrEqual(
          rankedContacts[i + 1].rankingScore
        );
      }
    });

    it('should assign global ranks correctly', () => {
      const settings = getDefaultUserSettings('AE');
      const rankedContacts = rankContacts(mockContacts, settings, 'global');

      expect(rankedContacts).toHaveLength(4);
      
      // Global ranks should be sequential starting from 1
      rankedContacts.forEach((contact, index) => {
        expect(contact.globalRank).toBe(index + 1);
      });
    });

    it('should handle empty contact list', () => {
      const settings = getDefaultUserSettings('AE');
      const rankedContacts = rankContacts([], settings, 'global');

      expect(rankedContacts).toHaveLength(0);
    });

    it('should handle single contact', () => {
      const settings = getDefaultUserSettings('AE');
      const singleContact = [mockContacts[0]];
      const rankedContacts = rankContacts(singleContact, settings, 'global');

      expect(rankedContacts).toHaveLength(1);
      expect(rankedContacts[0].globalRank).toBe(1);
      expect(rankedContacts[0].rankingScore).toBeDefined();
    });
  });

  describe('State-Based Ranking', () => {
    it('should rank contacts by state hierarchy', () => {
      const settings = getDefaultUserSettings('AE');
      const stateOrder = ['CA', 'NY', 'TX']; // California first, then New York, then Texas
      const rankedContacts = rankContacts(mockContacts, settings, 'state-based', stateOrder);

      expect(rankedContacts).toHaveLength(4);

      // Check state-based ranking fields
      rankedContacts.forEach(contact => {
        expect(contact.stateRank).toBeDefined();
        expect(contact.companyRankInState).toBeDefined();
        expect(contact.personRankInCompany).toBeDefined();
        expect(contact.rankingMode).toBe('state-based');
      });

      // CA contacts should have state rank 1
      const caContacts = rankedContacts.filter(c => c.state === 'CA');
      caContacts.forEach(contact => {
        expect(contact.stateRank).toBe(1);
      });

      // NY contacts should have state rank 2
      const nyContacts = rankedContacts.filter(c => c.state === 'NY');
      nyContacts.forEach(contact => {
        expect(contact.stateRank).toBe(2);
      });

      // TX contacts should have state rank 3
      const txContacts = rankedContacts.filter(c => c.state === 'TX');
      txContacts.forEach(contact => {
        expect(contact.stateRank).toBe(3);
      });
    });

    it('should rank companies within each state', () => {
      const settings = getDefaultUserSettings('AE');
      const stateOrder = ['CA', 'NY', 'TX'];
      const rankedContacts = rankContacts(mockContacts, settings, 'state-based', stateOrder);

      // Within CA state, companies should be ranked
      const caContacts = rankedContacts.filter(c => c.state === 'CA');
      expect(caContacts).toHaveLength(2); // John and Jane from Acme Corp
      
      // Both should be from the same company (Acme Corp)
      const companyIds = caContacts.map(c => 
        typeof c.company === 'object' ? c.company?.id : c.company
      );
      expect(new Set(companyIds)).toHaveLength(1); // All from same company
      
      // Company rank within state should be 1 (only one company in CA)
      caContacts.forEach(contact => {
        expect(contact.companyRankInState).toBe(1);
      });
    });

    it('should rank people within each company', () => {
      const settings = getDefaultUserSettings('AE');
      const stateOrder = ['CA', 'NY', 'TX'];
      const rankedContacts = rankContacts(mockContacts, settings, 'state-based', stateOrder);

      // Within Acme Corp (CA), people should be ranked
      const acmeContacts = rankedContacts.filter(c => 
        c.state === 'CA' && 
        (typeof c.company === 'object' ? c.company?.name : c.company) === 'Acme Corp'
      );
      
      expect(acmeContacts).toHaveLength(2);
      
      // Person ranks within company should be sequential
      const personRanks = acmeContacts.map(c => c.personRankInCompany).sort();
      expect(personRanks).toEqual([1, 2]);
    });

    it('should handle custom state ordering', () => {
      const settings = getDefaultUserSettings('AE');
      const stateOrder = ['TX', 'NY', 'CA']; // Texas first, then New York, then California
      const rankedContacts = rankContacts(mockContacts, settings, 'state-based', stateOrder);

      // TX contacts should have state rank 1
      const txContacts = rankedContacts.filter(c => c.state === 'TX');
      txContacts.forEach(contact => {
        expect(contact.stateRank).toBe(1);
      });

      // NY contacts should have state rank 2
      const nyContacts = rankedContacts.filter(c => c.state === 'NY');
      nyContacts.forEach(contact => {
        expect(contact.stateRank).toBe(2);
      });

      // CA contacts should have state rank 3
      const caContacts = rankedContacts.filter(c => c.state === 'CA');
      caContacts.forEach(contact => {
        expect(contact.stateRank).toBe(3);
      });
    });

    it('should handle contacts without state data', () => {
      const contactsWithoutState: CRMRecord[] = [
        {
          id: 1,
          name: 'John Doe',
          title: 'CEO',
          company: 'Acme Corp', // String instead of object with hqState
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
      const rankedContacts = rankContacts(contactsWithoutState, settings, 'state-based');

      expect(rankedContacts).toHaveLength(1);
      expect(rankedContacts[0].state).toBe('Unknown');
      expect(rankedContacts[0].stateRank).toBeDefined();
    });
  });

  describe('Ranking Score Calculation', () => {
    it('should calculate ranking scores for global mode', () => {
      const settings = getDefaultUserSettings('AE');
      const rankedContacts = rankContacts(mockContacts, settings, 'global');

      rankedContacts.forEach(contact => {
        expect(contact.rankingScore).toBeDefined();
        expect(contact.rankingScore).toBeGreaterThan(0);
        expect(typeof contact.rankingScore).toBe('number');
      });
    });

    it('should calculate combined scores for state-based mode', () => {
      const settings = getDefaultUserSettings('AE');
      const stateOrder = ['CA', 'NY', 'TX'];
      const rankedContacts = rankContacts(mockContacts, settings, 'state-based', stateOrder);

      rankedContacts.forEach(contact => {
        expect(contact.rankingScore).toBeDefined();
        expect(contact.rankingScore).toBeGreaterThan(0);
        expect(typeof contact.rankingScore).toBe('number');
        
        // State-based ranking should have different score calculation
        expect(contact.stateRank).toBeDefined();
        expect(contact.companyRankingScore).toBeDefined();
      });
    });

    it('should prioritize time zone calling priority', () => {
      const settings = getDefaultUserSettings('AE');
      const rankedContacts = rankContacts(mockContacts, settings, 'global');

      // If contacts have different calling priorities, they should be sorted accordingly
      const priorities = rankedContacts.map(c => c.callingPriority);
      const uniquePriorities = [...new Set(priorities)];
      
      if (uniquePriorities.length > 1) {
        // Higher priority contacts should come first
        for (let i = 0; i < rankedContacts.length - 1; i++) {
          const currentPriority = rankedContacts[i].callingPriority || 3;
          const nextPriority = rankedContacts[i + 1].callingPriority || 3;
          
          if (currentPriority !== nextPriority) {
            expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
            break; // Only check the first difference
          }
        }
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle contacts with missing company data', () => {
      const contactsWithMissingCompany: CRMRecord[] = [
        {
          id: 1,
          name: 'John Doe',
          title: 'CEO',
          company: null as any,
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
      const rankedContacts = rankContacts(contactsWithMissingCompany, settings, 'global');

      expect(rankedContacts).toHaveLength(1);
      expect(rankedContacts[0].rankingScore).toBeDefined();
    });

    it('should handle contacts with missing priority data', () => {
      const contactsWithMissingPriority: CRMRecord[] = [
        {
          id: 1,
          name: 'John Doe',
          title: 'CEO',
          company: { id: 'company-1', name: 'Acme Corp', hqState: 'CA' },
          email: 'john@acme.com',
          phone: '555-0001',
          photo: null,
          priority: '', // Empty priority
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
      const rankedContacts = rankContacts(contactsWithMissingPriority, settings, 'global');

      expect(rankedContacts).toHaveLength(1);
      expect(rankedContacts[0].rankingScore).toBeDefined();
    });

    it('should handle large contact lists efficiently', () => {
      // Create a large list of contacts
      const largeContactList: CRMRecord[] = Array.from({ length: 1000 }, (_, index) => ({
        id: index + 1,
        name: `Person ${index + 1}`,
        title: 'Employee',
        company: { 
          id: `company-${Math.floor(index / 10) + 1}`, 
          name: `Company ${Math.floor(index / 10) + 1}`,
          hqState: ['CA', 'NY', 'TX', 'FL'][Math.floor(index / 250)]
        },
        email: `person${index + 1}@company.com`,
        phone: `555-${String(index + 1).padStart(4, '0')}`,
        photo: null,
        priority: ['High', 'Medium', 'Low'][index % 3],
        status: 'Lead',
        lastContact: '2024-01-01',
        nextAction: 'Call',
        relationship: 'New',
        bio: `Employee ${index + 1}`,
        interests: ['Technology'],
        recentActivity: 'Active',
        commission: '3%'
      }));

      const settings = getDefaultUserSettings('AE');
      const startTime = Date.now();
      const rankedContacts = rankContacts(largeContactList, settings, 'global');
      const endTime = Date.now();

      expect(rankedContacts).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Verify all contacts have ranking data
      rankedContacts.forEach((contact, index) => {
        expect(contact.globalRank).toBe(index + 1);
        expect(contact.rankingScore).toBeDefined();
      });
    });
  });

  describe('Integration with User Settings', () => {
    it('should use different settings for different user roles', () => {
      const aeSettings = getDefaultUserSettings('AE');
      const seSettings = getDefaultUserSettings('SE');
      
      const aeRanked = rankContacts(mockContacts, aeSettings, 'global');
      const seRanked = rankContacts(mockContacts, seSettings, 'global');

      expect(aeRanked).toHaveLength(4);
      expect(seRanked).toHaveLength(4);
      
      // Rankings might be different based on role-specific scoring
      // This test ensures the system can handle different user settings
      aeRanked.forEach(contact => {
        expect(contact.rankingScore).toBeDefined();
      });
      
      seRanked.forEach(contact => {
        expect(contact.rankingScore).toBeDefined();
      });
    });
  });
});
