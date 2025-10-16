/**
 * Tests for intelligence validation utility
 */

import { 
  validatePersonData, 
  generatePersonSentence, 
  generateWantsStatement, 
  generateNeedsStatement,
  validateAIGeneratedText,
  hasIncompletePatterns,
  generateFallbackMessage
} from '../intelligence-validation';

describe('Intelligence Validation', () => {
  describe('validatePersonData', () => {
    it('should validate complete data correctly', () => {
      const data = {
        name: 'John Doe',
        title: 'VP of Operations',
        company: 'Acme Corp'
      };
      
      const result = validatePersonData(data);
      
      expect(result.isValid).toBe(true);
      expect(result.hasCompleteData).toBe(true);
      expect(result.missingFields).toEqual([]);
    });

    it('should handle missing company name', () => {
      const data = {
        name: 'John Doe',
        title: 'VP of Operations',
        company: ''
      };
      
      const result = validatePersonData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.hasCompleteData).toBe(false);
      expect(result.missingFields).toContain('company');
      expect(result.fallbackData.company).toBe('their organization');
    });

    it('should handle missing title', () => {
      const data = {
        name: 'John Doe',
        title: '',
        company: 'Acme Corp'
      };
      
      const result = validatePersonData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.hasCompleteData).toBe(false);
      expect(result.missingFields).toContain('title');
      expect(result.fallbackData.title).toBe('Professional');
    });

    it('should handle missing name', () => {
      const data = {
        name: '',
        title: 'VP of Operations',
        company: 'Acme Corp'
      };
      
      const result = validatePersonData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.hasCompleteData).toBe(false);
      expect(result.missingFields).toContain('name');
      expect(result.fallbackData.name).toBe('This professional');
    });

    it('should handle company as object with name property', () => {
      const data = {
        name: 'John Doe',
        title: 'VP of Operations',
        company: { name: 'Acme Corp' }
      };
      
      const result = validatePersonData(data);
      
      expect(result.isValid).toBe(true);
      expect(result.hasCompleteData).toBe(true);
      expect(result.missingFields).toEqual([]);
      expect(result.fallbackData.company).toBe('Acme Corp');
    });

    it('should handle company as object with empty name', () => {
      const data = {
        name: 'John Doe',
        title: 'VP of Operations',
        company: { name: '' }
      };
      
      const result = validatePersonData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.hasCompleteData).toBe(false);
      expect(result.missingFields).toContain('company');
      expect(result.fallbackData.company).toBe('their organization');
    });

    it('should handle company as object with undefined name', () => {
      const data = {
        name: 'John Doe',
        title: 'VP of Operations',
        company: { name: undefined }
      };
      
      const result = validatePersonData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.hasCompleteData).toBe(false);
      expect(result.missingFields).toContain('company');
      expect(result.fallbackData.company).toBe('their organization');
    });

    it('should handle company as empty object', () => {
      const data = {
        name: 'John Doe',
        title: 'VP of Operations',
        company: {}
      };
      
      const result = validatePersonData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.hasCompleteData).toBe(false);
      expect(result.missingFields).toContain('company');
      expect(result.fallbackData.company).toBe('their organization');
    });
  });

  describe('generatePersonSentence', () => {
    it('should generate complete sentence with all data', () => {
      const data = {
        name: 'John Doe',
        title: 'VP of Operations',
        company: 'Acme Corp'
      };
      
      const result = generatePersonSentence(data);
      
      expect(result).toBe('John Doe is a VP of Operations at Acme Corp.');
    });

    it('should avoid incomplete sentence when company is missing', () => {
      const data = {
        name: 'John Doe',
        title: 'VP of Operations',
        company: ''
      };
      
      const result = generatePersonSentence(data);
      
      expect(result).toBe('John Doe serves as a VP of Operations.');
      expect(result).not.toContain('at ,');
    });

    it('should handle missing title gracefully', () => {
      const data = {
        name: 'John Doe',
        title: '',
        company: 'Acme Corp'
      };
      
      const result = generatePersonSentence(data);
      
      expect(result).toBe('John Doe works at Acme Corp.');
    });

    it('should generate complete sentence with company as object', () => {
      const data = {
        name: 'John Doe',
        title: 'VP of Operations',
        company: { name: 'Acme Corp' }
      };
      
      const result = generatePersonSentence(data);
      
      expect(result).toBe('John Doe is a VP of Operations at Acme Corp.');
    });
  });

  describe('generateWantsStatement', () => {
    it('should generate complete wants statement with all data', () => {
      const data = {
        name: 'John Doe',
        title: 'VP of Operations',
        company: 'Acme Corp'
      };
      
      const result = generateWantsStatement(data, 'optimize team performance');
      
      expect(result).toBe('As a VP of Operations, John Doe wants to optimize team performance and drive meaningful impact at Acme Corp.');
    });

    it('should avoid incomplete sentence when company is missing', () => {
      const data = {
        name: 'John Doe',
        title: 'VP of Operations',
        company: ''
      };
      
      const result = generateWantsStatement(data, 'optimize team performance');
      
      expect(result).toBe('As a VP of Operations, John Doe wants to optimize team performance and drive meaningful impact in their role.');
      expect(result).not.toContain('at ,');
    });

    it('should generate complete wants statement with company as object', () => {
      const data = {
        name: 'John Doe',
        title: 'VP of Operations',
        company: { name: 'Acme Corp' }
      };
      
      const result = generateWantsStatement(data, 'optimize team performance');
      
      expect(result).toBe('As a VP of Operations, John Doe wants to optimize team performance and drive meaningful impact at Acme Corp.');
    });
  });

  describe('generateNeedsStatement', () => {
    it('should generate complete needs statement with all data', () => {
      const data = {
        name: 'John Doe',
        title: 'VP of Operations',
        company: 'Acme Corp'
      };
      
      const result = generateNeedsStatement(data, 'operational improvements');
      
      expect(result).toBe('John Doe needs operational improvements to optimize operational efficiency at Acme Corp.');
    });

    it('should avoid incomplete sentence when company is missing', () => {
      const data = {
        name: 'John Doe',
        title: 'VP of Operations',
        company: ''
      };
      
      const result = generateNeedsStatement(data, 'operational improvements');
      
      expect(result).toBe('John Doe needs operational improvements to optimize operational efficiency in their role.');
      expect(result).not.toContain('at ,');
    });

    it('should generate complete needs statement with company as object', () => {
      const data = {
        name: 'John Doe',
        title: 'VP of Operations',
        company: { name: 'Acme Corp' }
      };
      
      const result = generateNeedsStatement(data, 'operational improvements');
      
      expect(result).toBe('John Doe needs operational improvements to optimize operational efficiency at Acme Corp.');
    });
  });

  describe('validateAIGeneratedText', () => {
    it('should clean incomplete sentences with trailing prepositions', () => {
      const text = 'As a VP of Operations at , they want to optimize performance.';
      
      const result = validateAIGeneratedText(text);
      
      expect(result).toBe('As a VP of Operations they want to optimize performance.');
    });

    it('should handle trailing commas', () => {
      const text = 'This is a test sentence,';
      
      const result = validateAIGeneratedText(text);
      
      expect(result).toBe('This is a test sentence.');
    });

    it('should add period if missing', () => {
      const text = 'This is a test sentence';
      
      const result = validateAIGeneratedText(text);
      
      expect(result).toBe('This is a test sentence.');
    });
  });

  describe('hasIncompletePatterns', () => {
    it('should detect incomplete patterns', () => {
      expect(hasIncompletePatterns('As a VP of Operations at ,')).toBe(true);
      expect(hasIncompletePatterns('This is a complete sentence.')).toBe(false);
      expect(hasIncompletePatterns('Trailing comma,')).toBe(true);
      expect(hasIncompletePatterns('Ends with at')).toBe(true);
    });
  });

  describe('generateFallbackMessage', () => {
    it('should generate appropriate fallback for wants', () => {
      const data = {
        name: 'John Doe',
        title: 'VP of Operations',
        company: ''
      };
      
      const result = generateFallbackMessage(data, 'wants');
      
      expect(result).toBe('John Doe is focused on professional growth and career advancement.');
    });

    it('should generate appropriate fallback for needs', () => {
      const data = {
        name: 'John Doe',
        title: 'VP of Operations',
        company: ''
      };
      
      const result = generateFallbackMessage(data, 'needs');
      
      expect(result).toBe('John Doe requires solutions that support their professional objectives.');
    });
  });
});
