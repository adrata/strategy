/**
 * TESTS FOR AI-POWERED ROLE VARIATION GENERATOR
 * 
 * Demonstrates testing pure functions with AI fallbacks
 */

import {
  generateRoleVariations,
  generateWithPatterns,
  normalizeRoleTitle
} from '../generateRoleVariations';
import { getFallbackVariations, isCommonRole } from '../commonRoleDefinitions';
import { roleVariationCache } from '../roleVariationCache';
import { matchRoleTitle, getRoleTier, scoreRoleCandidates } from '../roleIntelligence';

describe('AI Role Variation Generator', () => {
  beforeEach(() => {
    // Clear cache before each test
    roleVariationCache.clear();
  });

  describe('Pattern-Based Generation (Fallback)', () => {
    it('should generate variations for VP Marketing', () => {
      const variations = generateWithPatterns('VP Marketing');
      
      expect(variations.baseRole).toBe('VP Marketing');
      expect(variations.variations.length).toBeGreaterThan(10);
      expect(variations.generatedBy).toBe('fallback');
      
      // Check tier 1 (C-level)
      expect(variations.tiers.tier1).toContain('Chief Marketing Officer');
      expect(variations.tiers.tier1).toContain('CMO');
      
      // Check tier 2 (VP-level)
      expect(variations.tiers.tier2).toContain('VP Marketing');
      expect(variations.tiers.tier2).toContain('Vice President Marketing');
    });

    it('should generate variations for Data Scientist', () => {
      const variations = generateWithPatterns('Data Scientist');
      
      expect(variations.baseRole).toBe('Data Scientist');
      expect(variations.variations.length).toBeGreaterThan(10);
      
      // Check for Data-specific variations
      expect(variations.tiers.tier1.some(v => v.includes('Data'))).toBe(true);
      expect(variations.tiers.tier4).toContain('Data Scientist');
    });

    it('should respect minTierLevel option', () => {
      const variations = generateWithPatterns('Product Manager', { minTierLevel: 3 });
      
      // Should not include tier 1 or tier 2
      expect(variations.tiers.tier1.length).toBe(0);
      expect(variations.tiers.tier2.length).toBe(0);
      
      // Should include tier 3 and tier 4
      expect(variations.tiers.tier3.length).toBeGreaterThan(0);
      expect(variations.tiers.tier4.length).toBeGreaterThan(0);
    });

    it('should respect maxVariations option', () => {
      const variations = generateWithPatterns('VP Sales', { maxVariations: 10 });
      
      expect(variations.totalVariations).toBeLessThanOrEqual(10);
      expect(variations.variations.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Common Role Definitions', () => {
    it('should recognize common roles', () => {
      expect(isCommonRole('VP Marketing')).toBe(true);
      expect(isCommonRole('Product Manager')).toBe(true);
      expect(isCommonRole('Data Scientist')).toBe(true);
      expect(isCommonRole('Underwater Basket Weaver')).toBe(false);
    });

    it('should provide fallback variations for common roles', () => {
      const variations = getFallbackVariations('VP Marketing');
      
      expect(variations).not.toBeNull();
      expect(variations!.variations.length).toBeGreaterThan(15);
      expect(variations!.generatedBy).toBe('fallback');
    });

    it('should return null for uncommon roles', () => {
      const variations = getFallbackVariations('Unicorn Wrangler');
      
      expect(variations).toBeNull();
    });
  });

  describe('Role Intelligence', () => {
    it('should match exact role titles', () => {
      const variations = generateWithPatterns('VP Marketing');
      const match = matchRoleTitle('VP Marketing', variations);
      
      expect(match.matched).toBe(true);
      expect(match.tier).toBe(2); // VP-level
      expect(match.confidence).toBe(100); // Exact match
      expect(match.exactMatch).toBe(true);
    });

    it('should match partial role titles', () => {
      const variations = generateWithPatterns('VP Marketing');
      const match = matchRoleTitle('Senior Vice President Marketing', variations);
      
      expect(match.matched).toBe(true);
      expect(match.tier).toBe(2); // VP-level
      expect(match.confidence).toBeGreaterThanOrEqual(85);
    });

    it('should detect role tiers correctly', () => {
      expect(getRoleTier('Chief Marketing Officer')).toBe(1); // C-level
      expect(getRoleTier('VP Marketing')).toBe(2); // VP-level
      expect(getRoleTier('Marketing Director')).toBe(3); // Director-level
      expect(getRoleTier('Marketing Manager')).toBe(4); // Manager-level
      expect(getRoleTier('Marketing Specialist')).toBe(5); // IC
    });

    it('should score and rank candidates', () => {
      const candidates = [
        { title: 'Marketing Manager', name: 'Alice' },
        { title: 'VP Marketing', name: 'Bob' },
        { title: 'Chief Marketing Officer', name: 'Charlie' }
      ];
      
      const variations = generateWithPatterns('VP Marketing');
      const scored = scoreRoleCandidates(candidates, 'VP Marketing', variations);
      
      // Should be sorted by score (highest first)
      expect(scored.length).toBe(3);
      expect(scored[0].ranking).toBe(1);
      expect(scored[1].ranking).toBe(2);
      expect(scored[2].ranking).toBe(3);
      
      // VP Marketing should score highest for exact match
      expect(scored[0].candidate.name).toBe('Bob');
      expect(scored[0].roleMatch.exactMatch).toBe(true);
    });
  });

  describe('Role Variation Cache', () => {
    it('should cache variations', () => {
      const role = 'VP Engineering';
      const variations = generateWithPatterns(role);
      
      // Set in cache
      roleVariationCache.set(role, variations);
      
      // Should be cached
      expect(roleVariationCache.has(role)).toBe(true);
      
      // Should retrieve from cache
      const cached = roleVariationCache.get(role);
      expect(cached).toEqual(variations);
    });

    it('should handle cache misses', () => {
      const cached = roleVariationCache.get('Nonexistent Role');
      
      expect(cached).toBeNull();
    });

    it('should provide cache statistics', () => {
      roleVariationCache.set('VP Marketing', generateWithPatterns('VP Marketing'));
      roleVariationCache.set('VP Sales', generateWithPatterns('VP Sales'));
      
      const stats = roleVariationCache.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(1000);
      expect(stats.ttlDays).toBe(7);
    });

    it('should clear cache', () => {
      roleVariationCache.set('VP Marketing', generateWithPatterns('VP Marketing'));
      expect(roleVariationCache.has('VP Marketing')).toBe(true);
      
      roleVariationCache.clear();
      expect(roleVariationCache.has('VP Marketing')).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    it('should normalize role titles', () => {
      expect(normalizeRoleTitle('VP Marketing')).toBe('vp marketing');
      expect(normalizeRoleTitle('  VP   Marketing  ')).toBe('vp marketing');
      expect(normalizeRoleTitle('VP-Marketing')).toBe('vp marketing');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty role strings gracefully', () => {
      expect(() => generateWithPatterns('')).not.toThrow();
    });

    it('should handle very long role names', () => {
      const longRole = 'VP of Global International Worldwide Marketing and Brand Strategy';
      const variations = generateWithPatterns(longRole);
      
      expect(variations.variations.length).toBeGreaterThan(0);
    });

    it('should handle special characters in role names', () => {
      const specialRole = 'VP (Marketing & Communications)';
      expect(() => generateWithPatterns(specialRole)).not.toThrow();
    });
  });
});

describe('Integration Tests', () => {
  it('should work end-to-end for VP Marketing', async () => {
    // 1. Generate variations (pattern-based for testing)
    const variations = generateWithPatterns('VP Marketing');
    
    // 2. Cache them
    roleVariationCache.set('VP Marketing', variations);
    
    // 3. Retrieve from cache
    const cached = roleVariationCache.get('VP Marketing');
    expect(cached).toEqual(variations);
    
    // 4. Match a title
    const match = matchRoleTitle('Vice President Marketing', variations);
    expect(match.matched).toBe(true);
    
    // 5. Get tier
    const tier = getRoleTier('Vice President Marketing');
    expect(tier).toBe(2);
  });
});
