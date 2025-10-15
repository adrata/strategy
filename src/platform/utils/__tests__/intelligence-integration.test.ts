/**
 * Integration tests for intelligence generation with missing data
 */

// Mock the monacoExtractors functions to test our fixes
const mockPerson = {
  name: 'John Doe',
  title: 'VP of Operations',
  company: '', // Missing company - this should trigger our validation
  vertical: 'Technology'
};

const mockPersonNoTitle = {
  name: 'Jane Smith',
  title: '', // Missing title
  company: 'Acme Corp',
  vertical: 'Technology'
};

const mockPersonNoName = {
  name: '', // Missing name
  title: 'VP of Operations',
  company: 'Acme Corp',
  vertical: 'Technology'
};

describe('Intelligence Generation Integration', () => {
  it('should handle missing company name gracefully', () => {
    // This would be the result from generatePersonalWants with missing company
    const { generateWantsStatement, validatePersonData } = require('../intelligence-validation');
    
    const personData = {
      name: mockPerson.name,
      title: mockPerson.title,
      company: mockPerson.company
    };
    
    const validation = validatePersonData(personData);
    const result = generateWantsStatement(personData, 'optimize team performance');
    
    expect(validation.missingFields).toContain('company');
    expect(result).not.toContain('at ,');
    expect(result).toContain('in their role');
  });

  it('should handle missing title gracefully', () => {
    const { generateWantsStatement, validatePersonData } = require('../intelligence-validation');
    
    const personData = {
      name: mockPersonNoTitle.name,
      title: mockPersonNoTitle.title,
      company: mockPersonNoTitle.company
    };
    
    const validation = validatePersonData(personData);
    const result = generateWantsStatement(personData, 'optimize team performance');
    
    expect(validation.missingFields).toContain('title');
    expect(result).not.toContain('As a ,');
    expect(result).toContain('Jane Smith wants to');
  });

  it('should handle missing name gracefully', () => {
    const { generateWantsStatement, validatePersonData } = require('../intelligence-validation');
    
    const personData = {
      name: mockPersonNoName.name,
      title: mockPersonNoName.title,
      company: mockPersonNoName.company
    };
    
    const validation = validatePersonData(personData);
    const result = generateWantsStatement(personData, 'optimize team performance');
    
    expect(validation.missingFields).toContain('name');
    expect(result).toContain('This VP of Operations wants to');
    expect(result).not.toContain('at ,');
  });

  it('should never generate incomplete sentences with trailing prepositions', () => {
    const { validateAIGeneratedText, hasIncompletePatterns } = require('../intelligence-validation');
    
    const incompleteTexts = [
      'As a VP of Operations at ,',
      'John works at ,',
      'This person is a Manager at ,',
      'Contact at , wants to improve',
    ];
    
    incompleteTexts.forEach(text => {
      expect(hasIncompletePatterns(text)).toBe(true);
      
      const cleaned = validateAIGeneratedText(text);
      expect(hasIncompletePatterns(cleaned)).toBe(false);
      expect(cleaned).not.toContain('at ,');
    });
  });

  it('should generate complete sentences even with minimal data', () => {
    const { generatePersonSentence } = require('../intelligence-validation');
    
    const minimalData = {
      name: '',
      title: '',
      company: ''
    };
    
    const result = generatePersonSentence(minimalData);
    
    expect(result).toBe('This professional serves as a Professional.');
    expect(result).not.toContain('at ,');
    expect(result).not.toContain('As a ,');
    expect(result.endsWith('.')).toBe(true);
  });
});
